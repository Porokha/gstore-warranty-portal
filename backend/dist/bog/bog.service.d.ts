import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { CasePayment } from '../payments/entities/case-payment.entity';
import { PaymentsService } from '../payments/payments.service';
export interface BOGPaymentResponse {
    order_id: string;
    payment_id: string;
    payment_url: string;
    status: string;
}
interface BOGCallbackData {
    order_id: string;
    payment_id: string;
    status: string;
    amount: string;
    currency: string;
    transaction_id?: string;
    signature?: string;
}
export declare class BogService {
    private configService;
    private paymentsRepository;
    private paymentsService;
    private readonly logger;
    private readonly api;
    private readonly apiUrl;
    private readonly merchantId;
    private readonly secretKey;
    private readonly callbackUrl;
    constructor(configService: ConfigService, paymentsRepository: Repository<CasePayment>, paymentsService: PaymentsService);
    private generateSignature;
    private verifySignature;
    initiatePayment(paymentId: number, amount: number, description: string, customerInfo: {
        first_name: string;
        last_name: string;
        phone: string;
        email?: string;
    }): Promise<BOGPaymentResponse>;
    handleCallback(callbackData: BOGCallbackData): Promise<void>;
    checkPaymentStatus(paymentId: number): Promise<any>;
}
export {};
