import { ServiceCase, ResultType } from '../../cases/entities/service-case.entity';
export declare enum PaymentMethod {
    ONSITE = "onsite",
    ONLINE = "online"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    PAID = "paid",
    FAILED = "failed"
}
export declare enum CodeStatus {
    ACTIVE = "active",
    USED = "used"
}
export declare class CasePayment {
    id: number;
    case_id: number;
    offer_type: ResultType;
    offer_amount: number;
    payment_method: PaymentMethod;
    payment_status: PaymentStatus;
    bog_transaction_id: string;
    estimated_days_after_payment: number;
    generated_code: string;
    code_status: CodeStatus;
    code_generated_at: Date;
    code_used_at: Date;
    created_at: Date;
    updated_at: Date;
    case_: ServiceCase;
}
