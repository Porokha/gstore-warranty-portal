import { ServiceCase } from '../../cases/entities/service-case.entity';
export declare enum CreatedSource {
    AUTO_WOO = "auto_woo",
    MANUAL = "manual"
}
export declare class Warranty {
    id: number;
    warranty_id: string;
    order_id: number;
    product_id: number;
    order_line_index: number;
    sku: string;
    imei: string;
    serial_number: string;
    device_type: string;
    title: string;
    thumbnail_url: string;
    price: number;
    customer_name: string;
    customer_last_name: string;
    customer_phone: string;
    customer_email: string;
    purchase_date: Date;
    warranty_start: Date;
    warranty_end: Date;
    extended_days: number;
    created_source: CreatedSource;
    created_at: Date;
    updated_at: Date;
    service_cases: ServiceCase[];
}
