import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Warranty } from '../warranties/entities/warranty.entity';
import { WarrantiesService } from '../warranties/warranties.service';
export interface WooCommerceOrder {
    id: number;
    status: string;
    date_created: string;
    billing: {
        first_name: string;
        last_name: string;
        phone: string;
        email: string;
    };
    line_items: Array<{
        id: number;
        product_id: number;
        name: string;
        sku: string;
        quantity: number;
        meta_data: Array<{
            key: string;
            value: string;
        }>;
    }>;
}
export interface WooCommerceProduct {
    id: number;
    name: string;
    sku: string;
    images: Array<{
        src: string;
    }>;
    meta_data: Array<{
        key: string;
        value: string;
    }>;
}
export declare class WooCommerceService {
    private configService;
    private warrantiesRepository;
    private warrantiesService;
    private readonly logger;
    private readonly api;
    private readonly baseUrl;
    private readonly consumerKey;
    private readonly consumerSecret;
    constructor(configService: ConfigService, warrantiesRepository: Repository<Warranty>, warrantiesService: WarrantiesService);
    getOrder(orderId: number): Promise<WooCommerceOrder>;
    getProduct(productId: number): Promise<WooCommerceProduct>;
    private extractMetaDataValue;
    private detectDeviceType;
    createWarrantyFromOrder(orderId: number, lineItemIndex?: number, allowedStatuses?: string[]): Promise<Warranty>;
    processOrderWebhook(orderId: number, status: string): Promise<void>;
    syncOrder(orderId: number, allowedStatuses?: string[]): Promise<Warranty[]>;
    syncOrdersByStatus(statuses: string[], limit?: number): Promise<{
        success: boolean;
        imported: number;
        warranties: any[];
    }>;
}
