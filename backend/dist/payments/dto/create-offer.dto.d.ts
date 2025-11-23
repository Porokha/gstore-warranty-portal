import { ResultType } from '../../cases/entities/service-case.entity';
import { PaymentMethod } from '../entities/case-payment.entity';
export declare class CreateOfferDto {
    offer_type: ResultType;
    offer_amount?: number;
    payment_method?: PaymentMethod;
    estimated_days_after_payment?: number;
}
