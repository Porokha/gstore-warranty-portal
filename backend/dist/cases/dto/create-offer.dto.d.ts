import { ResultType } from '../entities/service-case.entity';
import { PaymentMethod } from '../../payments/entities/case-payment.entity';
export declare class CreateOfferDto {
    offer_type: ResultType;
    offer_amount?: number;
    payment_method?: PaymentMethod;
    estimated_days_after_payment?: number;
    note_public?: string;
    note_private?: string;
}
