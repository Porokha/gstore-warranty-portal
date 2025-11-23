export declare class FilterWarrantyDto {
    search?: string;
    sku?: string;
    serial_number?: string;
    imei?: string;
    device_type?: string;
    customer_phone?: string;
    customer_name?: string;
    order_id?: number;
    product_id?: number;
    active_only?: boolean;
    expired_only?: boolean;
    purchase_date_from?: string;
    purchase_date_to?: string;
    warranty_end_from?: string;
    warranty_end_to?: string;
}
