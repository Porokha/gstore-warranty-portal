import { User } from '../../users/entities/user.entity';
import { Warranty } from '../../warranties/entities/warranty.entity';
import { CaseStatusHistory } from './case-status-history.entity';
import { CasePayment } from '../../payments/entities/case-payment.entity';
import { CaseFile } from '../../files/entities/case-file.entity';
export declare enum CaseStatusLevel {
    OPENED = 1,
    INVESTIGATING = 2,
    PENDING = 3,
    COMPLETED = 4
}
export declare enum ResultType {
    COVERED = "covered",
    PAYABLE = "payable",
    RETURNED = "returned",
    REPLACEABLE = "replaceable"
}
export declare enum Priority {
    LOW = "low",
    NORMAL = "normal",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare class ServiceCase {
    id: number;
    case_number: string;
    warranty_id: number;
    sku: string;
    imei: string;
    serial_number: string;
    device_type: string;
    product_title: string;
    customer_name: string;
    customer_last_name: string;
    customer_phone: string;
    customer_email: string;
    customer_initial_note: string;
    order_id: number;
    product_id: number;
    opened_at: Date;
    closed_at: Date;
    deadline_at: Date;
    status_level: CaseStatusLevel;
    result_type: ResultType;
    priority: Priority;
    tags: string[];
    assigned_technician_id: number;
    created_by: number;
    updated_at: Date;
    warranty: Warranty;
    assigned_technician: User;
    created_by_user: User;
    status_history: CaseStatusHistory[];
    payments: CasePayment[];
    files: CaseFile[];
}
