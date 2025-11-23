import { PaymentStatus } from '../entities/case-payment.entity';
export declare class UpdatePaymentDto {
    payment_status?: PaymentStatus;
    bog_transaction_id?: string;
    offer_amount?: number;
}
