import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CasePayment, PaymentStatus, CodeStatus } from './entities/case-payment.entity';
import { CaseType, ServiceCase, CaseStatusLevel, ResultType } from '../cases/entities/service-case.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { SmsService } from '../sms/sms.service';
import { Language } from '../sms/entities/sms-template.entity';
import { SmsStatus } from '../sms/entities/sms-log.entity';

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

    if (existingOffer) {
      throw new BadRequestException(
        `An offer of type ${createOfferDto.offer_type} already exists for this case`
      );
    }

    const payment = this.paymentsRepository.create({
      case_id: caseId,
      offer_type: createOfferDto.offer_type,
      offer_amount: createOfferDto.offer_amount || null,
      payment_method: createOfferDto.payment_method || null,
      payment_status: PaymentStatus.PENDING,
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

  async findAll(filters?: {
    start_date?: Date;
    end_date?: Date;
    device_type?: string;
    payment_status?: PaymentStatus;
    payment_method?: string;
  }): Promise<CasePayment[]> {
    const query = this.paymentsRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.case_', 'case')
      .leftJoinAndSelect('case.assigned_technician', 'technician')
      .leftJoinAndSelect('case.status_history', 'history')
      .orderBy('payment.created_at', 'DESC')
      .addOrderBy('history.created_at', 'ASC');

    if (filters?.start_date) {
      query.andWhere('payment.created_at >= :start_date', { start_date: filters.start_date });
    }

    if (filters?.end_date) {
      query.andWhere('payment.created_at <= :end_date', { end_date: filters.end_date });
    }

    if (filters?.device_type) {
      query.andWhere('case.device_type = :device_type', { device_type: filters.device_type });
    }

    if (filters?.payment_status) {
      query.andWhere('payment.payment_status = :payment_status', { payment_status: filters.payment_status });
    }

    if (filters?.payment_method) {
      query.andWhere('payment.payment_method = :payment_method', { payment_method: filters.payment_method });
    }

    return query.getMany();
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
    if (payment.payment_status === PaymentStatus.PAID) {
      throw new BadRequestException('Paid offers cannot be edited');
    }
    if (updateDto.offer_amount !== undefined) payment.offer_amount = updateDto.offer_amount;
    return this.paymentsRepository.save(payment);
  }

  async markAsPaid(
    paymentId: number,
    bogTransactionId?: string,
  ): Promise<CasePayment> {
    const payment = await this.findOne(paymentId);

    if (payment.offer_type !== ResultType.PAYABLE) {
      throw new BadRequestException('Only payable offers can be marked as paid');
    }

    if (payment.payment_status === PaymentStatus.PAID) {
      throw new BadRequestException('Payment is already marked as paid');
    }

    payment.payment_status = PaymentStatus.PAID;
    if (bogTransactionId) {
      payment.bog_transaction_id = bogTransactionId;
    }

    // If code exists, mark it as used
    if (payment.generated_code && payment.code_status === CodeStatus.ACTIVE) {
      payment.code_status = CodeStatus.USED;
      payment.code_used_at = new Date();
    }

    const savedPayment = await this.paymentsRepository.save(payment);

    // Send SMS notification for payment confirmation
    if (payment.case_ && payment.case_.case_type !== CaseType.PARTNER && payment.case_.customer_phone) {
      try {
        await this.smsService.sendSms({
          phone: payment.case_.customer_phone,
          templateKey: 'sms.payment.confirmed',
          language: Language.KA,
          variables: {
            case_number: payment.case_.case_number,
            amount: payment.offer_amount || 0,
            transaction_id: bogTransactionId || 'N/A',
          },
        });
      } catch (error) {
        console.error('Failed to send payment confirmation SMS:', error);
      }
    }

    return savedPayment;
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
