import { Priority } from '../entities/service-case.entity';
export declare class UpdateCaseDto {
    product_title?: string;
    customer_name?: string;
    customer_last_name?: string;
    customer_phone?: string;
    customer_email?: string;
    customer_initial_note?: string;
    sku?: string;
    serial_number?: string;
    imei?: string;
    device_type?: string;
    warranty_id?: number;
    order_id?: number;
    product_id?: number;
    assigned_technician_id?: number;
    priority?: Priority;
    tags?: string[];
    deadline_at?: string;
}
