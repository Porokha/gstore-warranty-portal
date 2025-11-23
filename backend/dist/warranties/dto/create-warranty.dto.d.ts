import { CreatedSource } from '../entities/warranty.entity';
export declare class CreateWarrantyDto {
    order_id?: number;
    product_id?: number;
    order_line_index?: number;
    sku: string;
    imei?: string;
    serial_number: string;
    device_type: string;
    title: string;
    thumbnail_url?: string;
    price: number;
    customer_name: string;
    customer_last_name: string;
    customer_phone: string;
    customer_email?: string;
    purchase_date: string;
    warranty_start: string;
    warranty_end: string;
    extended_days?: number;
    created_source?: CreatedSource;
}
