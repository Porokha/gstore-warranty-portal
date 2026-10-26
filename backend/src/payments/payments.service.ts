import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { CasePayment, PaymentStatus, CodeStatus } from './entities/case-payment.entity';
import { CaseType, ServiceCase, CaseStatusLevel, ResultType } from '../cases/entities/service-case.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { SmsService } from '../sms/sms.service';
import { Language } from '../sms/entities/sms-template.entity';
import { SmsStatus } from '../sms/entities/sms-log.entity';
import { financeCsvHeader, financeCsvRow } from './finance-export';

export type FinanceFilters = {
  start_date?: Date;
  end_date?: Date;
  date_basis?: 'created' | 'paid';
  device_type?: string;
  payment_status?: PaymentStatus;
  payment_method?: string;
};

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(CasePayment)
    private paymentsRepository: Repository<CasePayment>,
    @InjectRepository(ServiceCase)
    private casesRepository: Repository<ServiceCase>,
    private smsService: SmsService,
  ) {}

  async createOffer(caseId: number, createOfferDto: CreateOfferDto): Promise<CasePayment> {
    const case_ = await this.casesRepository.findOne({
      where: { id: caseId },
      relations: ['payments'],
    });

    if (!case_) {
      throw new NotFoundException(`Case with ID ${caseId} not found`);
    }

    // Check if case is in pending or completed status
    if (case_.status_level !== CaseStatusLevel.PENDING && 
        case_.status_level !== CaseStatusLevel.COMPLETED) {
      throw new BadRequestException('Offers can only be created for pending or completed cases');
    }
    if (case_.result_type !== createOfferDto.offer_type) {
      throw new BadRequestException('Offer must match the case result');
    }

    if (
      createOfferDto.offer_type === 'payable' &&
      case_.status_level !== CaseStatusLevel.PENDING
    ) {
      throw new BadRequestException('Payable offers can only be created while the case is pending');
    }

    // Check if offer already exists for this case and type
    const existingOffer = await this.paymentsRepository.findOne({
      where: {
        case_id: caseId,
        offer_type: createOfferDto.offer_type,
      },
    });

    if (existingOffer && existingOffer.payment_status !== PaymentStatus.CANCELLED) {
      throw new BadRequestException(
        `An offer of type ${createOfferDto.offer_type} already exists for this case`
      );
    }

    const payment = this.paymentsRepository.create({
      ...(existingOffer ? { id: existingOffer.id } : {}),
      case_id: caseId,
      offer_type: createOfferDto.offer_type,
      offer_amount: createOfferDto.offer_amount || null,
      payment_method: createOfferDto.payment_method || null,
      payment_status: PaymentStatus.PENDING,
      ...(existingOffer ? {
        bog_transaction_id: null,
        generated_code: null,
        code_status: null,
        code_generated_at: null,
        code_used_at: null,
        last_reminder_sent_at: null,
      } : {}),
      estimated_days_after_payment: createOfferDto.estimated_days_after_payment || null,
      replacement_product_title: createOfferDto.replacement_product_title || null,
    });

    const savedPayment = await this.paymentsRepository.save(payment);

    // Send SMS notification for payable offers
    if (
      case_.case_type !== CaseType.PARTNER &&
      createOfferDto.offer_type === 'payable' &&
      case_.customer_phone &&
      createOfferDto.offer_amount
    ) {
      try {
        await this.smsService.sendSms({
          phone: case_.customer_phone,
          templateKey: 'sms.offer.payable',
          language: Language.KA,
          variables: {
            case_number: case_.case_number,
            amount: createOfferDto.offer_amount,
            payment_code: savedPayment.generated_code || 'N/A',
          },
        });
      } catch (error) {
        console.error('Failed to send offer SMS:', error);
      }
    }

    return savedPayment;
  }

  async findAllByCase(caseId: number): Promise<CasePayment[]> {
    const case_ = await this.casesRepository.findOne({
      where: { id: caseId },
    });

    if (!case_) {
      throw new NotFoundException(`Case with ID ${caseId} not found`);
    }

    return this.paymentsRepository.find({
      where: { case_id: caseId },
      order: { created_at: 'DESC' },
    });
  }

  private financeQuery(filters: FinanceFilters = {}, selectCase = true): SelectQueryBuilder<CasePayment> {
    const query = this.paymentsRepository.createQueryBuilder('payment');
    if (selectCase) query.leftJoinAndSelect('payment.case_', 'case');
    else query.leftJoin('payment.case_', 'case');

    const dateColumn = filters.date_basis === 'paid' ? 'payment.paid_at' : 'payment.created_at';
    if (filters.start_date) query.andWhere(`${dateColumn} >= :start_date`, { start_date: filters.start_date });
    if (filters.end_date) query.andWhere(`${dateColumn} <= :end_date`, { end_date: filters.end_date });
    if (filters.device_type) query.andWhere('case.device_type = :device_type', { device_type: filters.device_type });
    if (filters.payment_status) query.andWhere('payment.payment_status = :payment_status', { payment_status: filters.payment_status });
    if (filters.payment_method) query.andWhere('payment.payment_method = :payment_method', { payment_method: filters.payment_method });
    return query;
  }

  async findAll(filters: FinanceFilters = {}, page = 1, limit = 50, includeHistory = false): Promise<{ data: CasePayment[]; total: number; page: number; limit: number }> {
    const query = this.financeQuery(filters)
      .leftJoinAndSelect('case.assigned_technician', 'technician')
      .orderBy('payment.created_at', 'DESC')
      .addOrderBy('payment.id', 'DESC');
    if (includeHistory) {
      query.leftJoinAndSelect('case.status_history', 'history')
        .addOrderBy('history.created_at', 'ASC');
    }
    const [data, total] = await query.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total, page, limit };
  }

  async getFinanceSummary(filters: FinanceFilters = {}) {
    const raw = await this.financeQuery(filters, false)
      .select('COUNT(payment.id)', 'count')
      .addSelect("COALESCE(SUM(CASE WHEN payment.offer_type = 'payable' AND payment.payment_status = 'paid' THEN payment.offer_amount ELSE 0 END), 0)", 'paid_amount')
      .addSelect("COALESCE(SUM(CASE WHEN payment.offer_type = 'payable' AND payment.payment_status = 'pending' THEN payment.offer_amount ELSE 0 END), 0)", 'pending_amount')
      .getRawOne();
    return {
      count: Number(raw?.count || 0),
      paid_amount: Number(raw?.paid_amount || 0),
      pending_amount: Number(raw?.pending_amount || 0),
    };
  }

  async exportFinanceCsv(filters: FinanceFilters = {}): Promise<string> {
    const matchingIds = await this.financeQuery(filters, false)
      .select('payment.id', 'id')
      .orderBy('payment.id', 'ASC')
      .getRawMany();
    const lines = ['\uFEFF' + financeCsvHeader];
    for (let offset = 0; offset < matchingIds.length; offset += 200) {
      const ids = matchingIds.slice(offset, offset + 200).map((row) => Number(row.id));
      const payments = await this.paymentsRepository.find({
        where: { id: In(ids) },
        relations: ['case_', 'case_.assigned_technician', 'case_.status_history'],
      });
      const byId = new Map(payments.map((payment) => [payment.id, payment]));
      for (const id of ids) {
        const payment = byId.get(id);
        if (!payment) throw new Error(`Finance export lost payment ${id} while loading`);
        lines.push(financeCsvRow(payment));
      }
    }

    return lines.join('\r\n');
  }

  async findOne(id: number): Promise<CasePayment> {
    const payment = await this.paymentsRepository.findOne({
      where: { id },
      relations: ['case_'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async update(id: number, updateDto: UpdatePaymentDto): Promise<CasePayment> {
    const payment = await this.findOne(id);
    if (payment.payment_status === PaymentStatus.PAID || payment.payment_status === PaymentStatus.CANCELLED ||
      payment.case_?.result_type !== payment.offer_type) {
      throw new BadRequestException('Only the current unpaid offer can be edited');
    }
    if (updateDto.offer_amount !== undefined) payment.offer_amount = updateDto.offer_amount;
    return this.paymentsRepository.save(payment);
  }

  async markAsPaid(
    paymentId: number,
    bogTransactionId?: string,
  ): Promise<CasePayment> {
    const current = await this.findOne(paymentId);
    if (current.offer_type !== ResultType.PAYABLE) {
      throw new BadRequestException('Only payable offers can be marked as paid');
    }
    const savedPayment = await this.paymentsRepository.manager.transaction(async (manager) => {
      // Lock the case first, matching the lock order used by case status changes.
      const case_ = await manager.findOne(ServiceCase, {
        where: { id: current.case_id },
        lock: { mode: 'pessimistic_write' },
      });
      const payment = await manager.findOne(CasePayment, {
        where: { id: paymentId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!case_ || !payment) throw new NotFoundException('Case payment not found');
      if (payment.offer_type !== ResultType.PAYABLE || case_.result_type !== ResultType.PAYABLE ||
        case_.status_level < CaseStatusLevel.PENDING) {
        throw new BadRequestException('Only the current payable case offer can be marked paid');
      }
      if (payment.payment_status !== PaymentStatus.PENDING) {
        throw new BadRequestException('Only pending payments can be marked paid');
      }
      payment.payment_status = PaymentStatus.PAID;
      payment.paid_at = new Date();
      if (bogTransactionId) payment.bog_transaction_id = bogTransactionId;
      if (payment.generated_code && payment.code_status === CodeStatus.ACTIVE) {
        payment.code_status = CodeStatus.USED;
        payment.code_used_at = new Date();
      }
      return manager.save(payment);
    });

    // Send SMS notification for payment confirmation
    if (current.case_ && current.case_.case_type !== CaseType.PARTNER && current.case_.customer_phone) {
      try {
        await this.smsService.sendSms({
          phone: current.case_.customer_phone,
          templateKey: 'sms.payment.confirmed',
          language: Language.KA,
          variables: {
            case_number: current.case_.case_number,
            amount: savedPayment.offer_amount || 0,
            transaction_id: bogTransactionId || 'N/A',
          },
        });
      } catch (error) {
        console.error('Failed to send payment confirmation SMS:', error);
      }
    }

    return savedPayment;
  }

  async retryFailed(paymentId: number): Promise<CasePayment> {
    const payment = await this.findOne(paymentId);
    if (payment.offer_type !== ResultType.PAYABLE || payment.case_?.result_type !== ResultType.PAYABLE ||
      payment.case_.status_level !== CaseStatusLevel.PENDING) {
      throw new BadRequestException('Only failed offers on pending payable cases can be retried');
    }
    const updated = await this.paymentsRepository.update(
      { id: paymentId, payment_status: PaymentStatus.FAILED },
      { payment_status: PaymentStatus.PENDING },
    );
    if (!updated.affected) throw new BadRequestException('Payment is no longer failed');
    return this.findOne(paymentId);
  }

  async markAsFailed(paymentId: number): Promise<CasePayment> {
    const payment = await this.findOne(paymentId);

    if (payment.offer_type !== ResultType.PAYABLE) {
      throw new BadRequestException('Only payable offers can be marked as failed');
    }
    if (payment.payment_status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Only pending payments can be marked as failed');
    }

    const updated = await this.paymentsRepository.update(
      { id: paymentId, payment_status: PaymentStatus.PENDING },
      { payment_status: PaymentStatus.FAILED },
    );
    if (!updated.affected) throw new BadRequestException('Payment is no longer pending');
    return this.findOne(paymentId);
  }

  async sendPaymentReminder(paymentId: number): Promise<CasePayment> {
    const payment = await this.findOne(paymentId);

    if (payment.offer_type !== 'payable') {
      throw new BadRequestException('Payment reminders can only be sent for payable offers');
    }

    if (payment.payment_status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment reminders can only be sent for pending payments');
    }

    if (payment.case_?.result_type !== ResultType.PAYABLE ||
      payment.case_.status_level !== CaseStatusLevel.PENDING) {
      throw new BadRequestException('Payment reminders require the current pending payable result');
    }

    if (!payment.case_) {
      throw new NotFoundException(`Case for payment ${paymentId} not found`);
    }

    if (payment.case_.case_type === CaseType.PARTNER) {
      throw new BadRequestException('Partner cases do not send customer SMS notifications');
    }

    if (!payment.case_.customer_phone) {
      throw new BadRequestException('Customer phone number is missing');
    }

    const cooldownMs = 30 * 60 * 1000;
    if (
      payment.last_reminder_sent_at &&
      Date.now() - new Date(payment.last_reminder_sent_at).getTime() < cooldownMs
    ) {
      throw new BadRequestException('Payment reminder was already sent in the last 30 minutes');
    }

    const log = await this.smsService.sendSms({
      phone: payment.case_.customer_phone,
      templateKey: 'Case_needs_payment',
      eventType: 'manual.payment_reminder',
      language: Language.KA,
      variables: {
        case_number: payment.case_.case_number,
        customer_name: payment.case_.customer_name || '',
        customer_last_name: payment.case_.customer_last_name || '',
        product_title: payment.case_.product_title || '',
        amount: payment.offer_amount || 0,
      },
      skipIfDisabled: false,
    });

    if (log.status !== SmsStatus.SENT) {
      throw new BadRequestException(log.api_response || 'Payment reminder SMS failed');
    }

    payment.last_reminder_sent_at = new Date();
    return this.paymentsRepository.save(payment);
  }

  async remove(id: number): Promise<void> {
    const payment = await this.findOne(id);

    // Only allow deletion if payment is pending
    if (payment.payment_status !== PaymentStatus.PENDING) {
      throw new ForbiddenException('Can only delete pending payments');
    }

    await this.paymentsRepository.remove(payment);
  }

  async getStats(caseId?: number) {
    const queryBuilder = this.paymentsRepository.createQueryBuilder('payment');

    if (caseId) {
      queryBuilder.where('payment.case_id = :caseId', { caseId });
    }

    const total = await queryBuilder.getCount();

    const pending = await queryBuilder
      .clone()
      .andWhere('payment.payment_status = :status', { status: PaymentStatus.PENDING })
      .getCount();

    const paid = await queryBuilder
      .clone()
      .andWhere('payment.payment_status = :status', { status: PaymentStatus.PAID })
      .getCount();

    const failed = await queryBuilder
      .clone()
      .andWhere('payment.payment_status = :status', { status: PaymentStatus.FAILED })
      .getCount();

    // Calculate total amount paid
    const paidPayments = await queryBuilder
      .clone()
      .andWhere('payment.payment_status = :status', { status: PaymentStatus.PAID })
      .getMany();

    const totalAmount = paidPayments.reduce(
      (sum, payment) => sum + (payment.offer_amount || 0),
      0,
    );

    return {
      total,
      pending,
      paid,
      failed,
      totalAmount,
    };
  }
}
