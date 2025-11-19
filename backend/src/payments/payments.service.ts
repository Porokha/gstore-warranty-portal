import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CasePayment, PaymentStatus, CodeStatus } from './entities/case-payment.entity';
import { ServiceCase, CaseStatusLevel } from '../cases/entities/service-case.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { GenerateCodeDto } from './dto/generate-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(CasePayment)
    private paymentsRepository: Repository<CasePayment>,
    @InjectRepository(ServiceCase)
    private casesRepository: Repository<ServiceCase>,
  ) {}

  async generateCode(): Promise<string> {
    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Check if code already exists
    const existing = await this.paymentsRepository.findOne({
      where: { generated_code: code, code_status: CodeStatus.ACTIVE },
    });

    if (existing) {
      // Recursively generate a new code if collision
      return this.generateCode();
    }

    return code;
  }

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
    });

    return this.paymentsRepository.save(payment);
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
    
    Object.assign(payment, updateDto);
    return this.paymentsRepository.save(payment);
  }

  async generatePaymentCode(
    paymentId: number,
    generateCodeDto: GenerateCodeDto,
  ): Promise<CasePayment> {
    const payment = await this.findOne(paymentId);

    if (payment.payment_status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Code can only be generated for pending payments');
    }

    if (payment.generated_code && payment.code_status === CodeStatus.ACTIVE) {
      throw new BadRequestException('An active code already exists for this payment');
    }

    const code = await this.generateCode();

    payment.generated_code = code;
    payment.code_status = CodeStatus.ACTIVE;
    payment.code_generated_at = new Date();
    payment.estimated_days_after_payment = generateCodeDto.estimated_days_after_payment;

    return this.paymentsRepository.save(payment);
  }

  async verifyCode(verifyCodeDto: VerifyCodeDto): Promise<CasePayment> {
    const payment = await this.paymentsRepository.findOne({
      where: {
        generated_code: verifyCodeDto.code,
        code_status: CodeStatus.ACTIVE,
      },
      relations: ['case_'],
    });

    if (!payment) {
      throw new NotFoundException('Invalid or expired code');
    }

    // Check if code is already used
    if (payment.code_status === CodeStatus.USED) {
      throw new BadRequestException('This code has already been used');
    }

    // Mark code as used
    payment.code_status = CodeStatus.USED;
    payment.code_used_at = new Date();
    payment.payment_status = PaymentStatus.PAID;

    // Update case status if needed
    if (payment.case_ && payment.case_.status_level === CaseStatusLevel.PENDING) {
      payment.case_.status_level = CaseStatusLevel.COMPLETED;
      payment.case_.result_type = payment.offer_type;
      await this.casesRepository.save(payment.case_);
    }

    return this.paymentsRepository.save(payment);
  }

  async markAsPaid(
    paymentId: number,
    bogTransactionId?: string,
  ): Promise<CasePayment> {
    const payment = await this.findOne(paymentId);

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

    // Update case status if needed
    if (payment.case_ && payment.case_.status_level === CaseStatusLevel.PENDING) {
      payment.case_.status_level = CaseStatusLevel.COMPLETED;
      payment.case_.result_type = payment.offer_type;
      await this.casesRepository.save(payment.case_);
    }

    return this.paymentsRepository.save(payment);
  }

  async markAsFailed(paymentId: number): Promise<CasePayment> {
    const payment = await this.findOne(paymentId);

    payment.payment_status = PaymentStatus.FAILED;
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
