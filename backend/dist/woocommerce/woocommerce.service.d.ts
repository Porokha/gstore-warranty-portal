import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Warranty } from '../warranties/entities/warranty.entity';
import { WarrantiesService } from '../warranties/warranties.service';
import { SettingsService } from '../settings/settings.service';
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
    private settingsService;
    private readonly logger;
    private api;
    private baseUrl;
    constructor(configService: ConfigService, warrantiesRepository: Repository<Warranty>, warrantiesService: WarrantiesService, settingsService: SettingsService);
    private initializeApi;
    private getApi;
    getOrder(orderId: number): Promise<WooCommerceOrder>;
    getProduct(productId: number): Promise<WooCommerceProduct>;
    private extractMetaDataValue;
    private detectDeviceType;
    createWarrantyFromOrder(orderId: number, lineItemIndex?: number, allowedStatuses?: string[]): Promise<Warranty>;
    processOrderWebhook(orderId: number, status: string): Promise<void>;
    syncOrder(orderId: number, allowedStatuses?: string[]): Promise<Warranty[]>;
    syncOrdersByStatus(statuses: string[], options?: {
        limit?: number;
        dateFrom?: string;
        skipDuplicates?: boolean;
    }): Promise<{
        success: boolean;
        imported: number;
        skipped: number;
        warranties: any[];
    }>;
}
