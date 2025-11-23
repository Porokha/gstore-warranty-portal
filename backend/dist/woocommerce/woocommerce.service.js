"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WooCommerceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WooCommerceService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = require("axios");
const warranty_entity_1 = require("../warranties/entities/warranty.entity");
const warranties_service_1 = require("../warranties/warranties.service");
let WooCommerceService = WooCommerceService_1 = class WooCommerceService {
    constructor(configService, warrantiesRepository, warrantiesService) {
        this.configService = configService;
        this.warrantiesRepository = warrantiesRepository;
        this.warrantiesService = warrantiesService;
        this.logger = new common_1.Logger(WooCommerceService_1.name);
        this.baseUrl = this.configService.get('WOOCOMMERCE_URL');
        this.consumerKey = this.configService.get('WOOCOMMERCE_CONSUMER_KEY');
        this.consumerSecret = this.configService.get('WOOCOMMERCE_CONSUMER_SECRET');
        if (!this.baseUrl || !this.consumerKey || !this.consumerSecret) {
            this.logger.warn('WooCommerce credentials not configured');
            return;
        }
        this.api = axios_1.default.create({
            baseURL: this.baseUrl,
            auth: {
                username: this.consumerKey,
                password: this.consumerSecret,
            },
            timeout: 30000,
        });
    }
    async getOrder(orderId) {
        try {
            const response = await this.api.get(`/wp-json/wc/v3/orders/${orderId}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to fetch order ${orderId}:`, error.message);
            throw new common_1.BadRequestException(`Failed to fetch order from WooCommerce`);
        }
    }
    async getProduct(productId) {
        try {
            const response = await this.api.get(`/wp-json/wc/v3/products/${productId}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to fetch product ${productId}:`, error.message);
            throw new common_1.BadRequestException(`Failed to fetch product from WooCommerce`);
        }
    }
    extractMetaDataValue(metaData, key) {
        const item = metaData.find((m) => m.key.toLowerCase() === key.toLowerCase());
        return item ? item.value : null;
    }
    detectDeviceType(productName, sku) {
        const name = productName.toLowerCase();
        const skuLower = sku.toLowerCase();
        if (name.includes('phone') || skuLower.includes('phone')) {
            return 'Phone';
        }
        if (name.includes('tablet') || skuLower.includes('tablet')) {
            return 'Tablet';
        }
        if (name.includes('desktop') || skuLower.includes('desktop')) {
            return 'Desktop';
        }
        return 'Laptop';
    }
    async createWarrantyFromOrder(orderId, lineItemIndex = 0, allowedStatuses) {
        const order = await this.getOrder(orderId);
        if (allowedStatuses && !allowedStatuses.includes(order.status)) {
            throw new common_1.BadRequestException(`Order status ${order.status} is not allowed. Allowed statuses: ${allowedStatuses.join(', ')}`);
        }
        if (!allowedStatuses && order.status !== 'completed') {
            throw new common_1.BadRequestException('Can only create warranty for completed orders');
        }
        if (!order.line_items || order.line_items.length === 0) {
            throw new common_1.BadRequestException('Order has no line items');
        }
        const lineItem = order.line_items[lineItemIndex];
        if (!lineItem) {
            throw new common_1.BadRequestException(`Line item at index ${lineItemIndex} not found`);
        }
        const existingWarranty = await this.warrantiesRepository.findOne({
            where: {
                order_id: orderId,
                order_line_index: lineItemIndex,
            },
        });
        if (existingWarranty) {
            this.logger.log(`Warranty already exists for order ${orderId}, line item ${lineItemIndex}`);
            return existingWarranty;
        }
        const product = await this.getProduct(lineItem.product_id);
        const serialNumber = this.extractMetaDataValue(lineItem.meta_data, 'serial_number') ||
            this.extractMetaDataValue(lineItem.meta_data, 'serial') ||
            this.extractMetaDataValue(product.meta_data, 'serial_number') ||
            this.extractMetaDataValue(product.meta_data, 'serial');
        const finalSerialNumber = serialNumber || `ORD-${orderId}-PROD-${lineItem.product_id}-${lineItemIndex}`;
        const imei = this.extractMetaDataValue(lineItem.meta_data, 'imei') ||
            this.extractMetaDataValue(product.meta_data, 'imei');
        const deviceType = this.detectDeviceType(product.name, product.sku);
        const purchaseDate = new Date(order.date_created);
        const warrantyStart = new Date(purchaseDate);
        const warrantyEnd = new Date(purchaseDate);
        warrantyEnd.setFullYear(warrantyEnd.getFullYear() + 1);
        const price = parseFloat(lineItem.meta_data.find(m => m.key === '_line_total')?.value || '0') ||
            parseFloat(product.meta_data.find(m => m.key === '_price')?.value || '0') ||
            0;
        const thumbnailUrl = product.images && product.images.length > 0
            ? product.images[0].src
            : null;
        const warrantyId = await this.warrantiesService.generateWarrantyId(warranty_entity_1.CreatedSource.AUTO_WOO, orderId, lineItem.product_id);
        const warranty = this.warrantiesRepository.create({
            warranty_id: warrantyId,
            order_id: orderId,
            product_id: lineItem.product_id,
            order_line_index: lineItemIndex,
            sku: lineItem.sku || product.sku,
            imei: imei || null,
            serial_number: finalSerialNumber,
            device_type: deviceType,
            title: product.name,
            thumbnail_url: thumbnailUrl,
            price: price,
            customer_name: order.billing.first_name,
            customer_last_name: order.billing.last_name,
            customer_phone: order.billing.phone,
            customer_email: order.billing.email,
            purchase_date: purchaseDate,
            warranty_start: warrantyStart,
            warranty_end: warrantyEnd,
            created_source: warranty_entity_1.CreatedSource.AUTO_WOO,
            extended_days: 0,
        });
        const savedWarranty = await this.warrantiesRepository.save(warranty);
        this.logger.log(`Created warranty ${savedWarranty.warranty_id} from order ${orderId}`);
        return savedWarranty;
    }
    async processOrderWebhook(orderId, status) {
        if (status !== 'completed') {
            this.logger.log(`Order ${orderId} status is ${status}, skipping warranty creation`);
            return;
        }
        try {
            const order = await this.getOrder(orderId);
            for (let i = 0; i < order.line_items.length; i++) {
                try {
                    await this.createWarrantyFromOrder(orderId, i);
                }
                catch (error) {
                    this.logger.error(`Failed to create warranty for order ${orderId}, line item ${i}:`, error.message);
                }
            }
        }
        catch (error) {
            this.logger.error(`Failed to process webhook for order ${orderId}:`, error.message);
            throw error;
        }
    }
    async syncOrder(orderId, allowedStatuses) {
        const order = await this.getOrder(orderId);
        const warranties = [];
        for (let i = 0; i < order.line_items.length; i++) {
            try {
                const warranty = await this.createWarrantyFromOrder(orderId, i, allowedStatuses);
                warranties.push(warranty);
            }
            catch (error) {
                this.logger.error(`Failed to sync warranty for order ${orderId}, line item ${i}:`, error.message);
            }
        }
        return warranties;
    }
    async syncOrdersByStatus(statuses, limit = 100) {
        if (!this.api) {
            throw new common_1.BadRequestException('WooCommerce not configured');
        }
        try {
            const allWarranties = [];
            let page = 1;
            let hasMore = true;
            while (hasMore && allWarranties.length < limit) {
                const response = await this.api.get('/wp-json/wc/v3/orders', {
                    params: {
                        status: statuses.join(','),
                        per_page: Math.min(100, limit - allWarranties.length),
                        page,
                    },
                });
                const orders = response.data;
                if (orders.length === 0) {
                    hasMore = false;
                    break;
                }
                for (const order of orders) {
                    try {
                        for (let i = 0; i < order.line_items.length; i++) {
                            const warranty = await this.createWarrantyFromOrder(order.id, i, statuses);
                            allWarranties.push(warranty);
                            if (allWarranties.length >= limit) {
                                hasMore = false;
                                break;
                            }
                        }
                    }
                    catch (error) {
                        this.logger.error(`Failed to process order ${order.id}:`, error.message);
                    }
                }
                page++;
                if (orders.length < 100) {
                    hasMore = false;
                }
            }
            return {
                success: true,
                imported: allWarranties.length,
                warranties: allWarranties,
            };
        }
        catch (error) {
            this.logger.error('Failed to sync orders:', error.message);
            throw new common_1.BadRequestException(`Failed to sync orders: ${error.message}`);
        }
    }
};
exports.WooCommerceService = WooCommerceService;
exports.WooCommerceService = WooCommerceService = WooCommerceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(warranty_entity_1.Warranty)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository,
        warranties_service_1.WarrantiesService])
], WooCommerceService);
//# sourceMappingURL=woocommerce.service.js.map