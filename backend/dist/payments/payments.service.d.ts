import { Repository } from 'typeorm';
import { CasePayment, PaymentStatus } from './entities/case-payment.entity';
import { ServiceCase } from '../cases/entities/service-case.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { GenerateCodeDto } from './dto/generate-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { SmsService } from '../sms/sms.service';
export declare class PaymentsService {
    private paymentsRepository;
    private casesRepository;
    private smsService;
    constructor(paymentsRepository: Repository<CasePayment>, casesRepository: Repository<ServiceCase>, smsService: SmsService);
    generateCode(): Promise<string>;
    createOffer(caseId: number, createOfferDto: CreateOfferDto): Promise<CasePayment>;
    findAllByCase(caseId: number): Promise<CasePayment[]>;
    findAll(filters?: {
        start_date?: Date;
        end_date?: Date;
        device_type?: string;
        payment_status?: PaymentStatus;
        payment_method?: string;
    }): Promise<CasePayment[]>;
    findOne(id: number): Promise<CasePayment>;
    update(id: number, updateDto: UpdatePaymentDto): Promise<CasePayment>;
    generatePaymentCode(paymentId: number, generateCodeDto: GenerateCodeDto): Promise<CasePayment>;
    verifyCode(verifyCodeDto: VerifyCodeDto): Promise<CasePayment>;
    markAsPaid(paymentId: number, bogTransactionId?: string): Promise<CasePayment>;
    markAsFailed(paymentId: number): Promise<CasePayment>;
    remove(id: number): Promise<void>;
    getStats(caseId?: number): Promise<{
        total: number;
        pending: number;
        paid: number;
        failed: number;
        totalAmount: number;
    }>;
}
