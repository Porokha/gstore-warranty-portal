import { PaymentsService } from './payments.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { GenerateCodeDto } from './dto/generate-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
export declare class PaymentsController {
    private paymentsService;
    constructor(paymentsService: PaymentsService);
    createOffer(caseId: number, createOfferDto: CreateOfferDto): Promise<import("./entities/case-payment.entity").CasePayment>;
    findAllByCase(caseId: number): Promise<import("./entities/case-payment.entity").CasePayment[]>;
    findOne(id: number): Promise<import("./entities/case-payment.entity").CasePayment>;
    update(id: number, updateDto: UpdatePaymentDto): Promise<import("./entities/case-payment.entity").CasePayment>;
    generateCode(id: number, generateCodeDto: GenerateCodeDto): Promise<import("./entities/case-payment.entity").CasePayment>;
    markAsPaid(id: number, bogTransactionId?: string): Promise<import("./entities/case-payment.entity").CasePayment>;
    markAsFailed(id: number): Promise<import("./entities/case-payment.entity").CasePayment>;
    remove(id: number): Promise<void>;
    findAll(startDate?: string, endDate?: string, deviceType?: string, paymentStatus?: string, paymentMethod?: string): Promise<import("./entities/case-payment.entity").CasePayment[]>;
    getStats(caseId?: number): Promise<{
        total: number;
        pending: number;
        paid: number;
        failed: number;
        totalAmount: number;
    }>;
    verifyCode(verifyCodeDto: VerifyCodeDto): Promise<import("./entities/case-payment.entity").CasePayment>;
}
