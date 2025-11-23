import { Priority } from '../entities/service-case.entity';
export declare class CreateCaseDto {
    warranty_id?: number;
    sku: string;
    imei?: string;
    serial_number: string;
    device_type: string;
    product_title: string;
    customer_name: string;
    customer_last_name?: string;
    customer_phone: string;
    customer_email?: string;
    customer_initial_note?: string;
    order_id?: number;
    product_id?: number;
    assigned_technician_id?: number;
    priority?: Priority;
    tags?: string[];
    deadline_days?: number;
}
