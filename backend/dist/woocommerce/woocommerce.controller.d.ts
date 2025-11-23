import { WooCommerceService, WooCommerceOrder, WooCommerceProduct } from './woocommerce.service';
export declare class WooCommerceController {
    private wooCommerceService;
    constructor(wooCommerceService: WooCommerceService);
    handleOrderWebhook(body: {
        id: number;
        status: string;
    }): Promise<{
        success: boolean;
    }>;
    syncOrder(orderId: number): Promise<{
        success: boolean;
        warranties: import("../warranties/entities/warranty.entity").Warranty[];
        count: number;
    }>;
    createWarranty(orderId: number, lineItemIndex?: number): Promise<import("../warranties/entities/warranty.entity").Warranty>;
    getOrder(orderId: number): Promise<WooCommerceOrder>;
    getProduct(productId: number): Promise<WooCommerceProduct>;
    syncOrders(body: {
        statuses?: string[];
        limit?: number;
    }): Promise<{
        success: boolean;
        imported: number;
        warranties: any[];
    }>;
}
