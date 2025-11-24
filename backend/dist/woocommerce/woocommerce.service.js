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
const settings_service_1 = require("../settings/settings.service");
let WooCommerceService = WooCommerceService_1 = class WooCommerceService {
    constructor(configService, warrantiesRepository, warrantiesService, settingsService) {
        this.configService = configService;
        this.warrantiesRepository = warrantiesRepository;
        this.warrantiesService = warrantiesService;
        this.settingsService = settingsService;
        this.logger = new common_1.Logger(WooCommerceService_1.name);
        this.api = null;
        this.baseUrl = null;
        this.lastApiKeyHash = null;
    }
    async getApi() {
        try {
            const apiKeys = await this.settingsService.getApiKeys();
            this.logger.debug('Retrieved API keys from settings:', {
                hasUrl: !!apiKeys.woocommerce_url,
                hasKey: !!apiKeys.woocommerce_consumer_key,
                hasSecret: !!apiKeys.woocommerce_consumer_secret,
                url: apiKeys.woocommerce_url ? `${apiKeys.woocommerce_url.substring(0, 20)}...` : 'none',
            });
            const baseUrl = apiKeys.woocommerce_url || this.configService.get('WOOCOMMERCE_URL');
            const consumerKey = apiKeys.woocommerce_consumer_key || this.configService.get('WOOCOMMERCE_CONSUMER_KEY');
            const consumerSecret = apiKeys.woocommerce_consumer_secret || this.configService.get('WOOCOMMERCE_CONSUMER_SECRET');
            const currentHash = `${baseUrl || ''}|${consumerKey || ''}|${consumerSecret ? '***' : ''}`;
            this.logger.log(`WooCommerce API check - URL: ${baseUrl ? `set (${baseUrl})` : 'missing'}, Key: ${consumerKey ? 'set' : 'missing'}, Secret: ${consumerSecret ? 'set' : 'missing'}`);
            if (baseUrl && consumerKey && consumerSecret) {
                const normalizedUrl = baseUrl.trim().replace(/\/$/, '');
                const needsReinit = !this.api || this.lastApiKeyHash !== currentHash;
                if (needsReinit) {
                    this.baseUrl = normalizedUrl;
                    this.lastApiKeyHash = currentHash;
                    this.api = axios_1.default.create({
                        baseURL: `${normalizedUrl}/wp-json/wc/v3`,
                        auth: {
                            username: consumerKey.trim(),
                            password: consumerSecret.trim(),
                        },
                        timeout: 30000,
                    });
                    this.logger.log(`WooCommerce API initialized from settings (URL: ${normalizedUrl})`);
                }
                return this.api;
            }
            else {
                this.logger.warn('WooCommerce API keys incomplete in settings');
            }
        }
        catch (error) {
            this.logger.error('Failed to get WooCommerce API from settings:', error);
        }
        if (this.api) {
            this.logger.warn('Using cached WooCommerce API instance, but settings check failed');
            return this.api;
        }
        throw new common_1.BadRequestException('WooCommerce API not configured. Please set WooCommerce API keys in Settings > API Keys.');
    }
    async getOrder(orderId) {
        const api = await this.getApi();
        try {
            const response = await api.get(`/orders/${orderId}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to fetch order ${orderId}:`, error.message);
            throw new common_1.BadRequestException(`Failed to fetch order from WooCommerce`);
        }
    }
    async getProduct(productId) {
        const api = await this.getApi();
        try {
            const response = await api.get(`/products/${productId}`);
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
        const automationEnabled = await this.settingsService.get('WOOCOMMERCE_AUTOMATION_ENABLED');
        if (automationEnabled !== 'true') {
            this.logger.log(`WooCommerce automation is disabled, skipping order ${orderId}`);
            return;
        }
        try {
            const order = await this.getOrder(orderId);
            for (let i = 0; i < order.line_items.length; i++) {
                try {
                    const existing = await this.warrantiesRepository.findOne({
                        where: {
                            order_id: orderId,
                            order_line_index: i,
                        },
                    });
                    if (existing) {
                        this.logger.log(`Warranty already exists for order ${orderId}, line item ${i}, skipping`);
                        continue;
                    }
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
    async syncOrdersByStatus(statuses, options) {
        const api = await this.getApi();
        if (!statuses || statuses.length === 0) {
            throw new common_1.BadRequestException('At least one order status must be specified');
        }
        try {
            const allWarranties = [];
            const skipped = [];
            let page = 1;
            let hasMore = true;
            const limit = options?.limit;
            const dateFrom = options?.dateFrom ? new Date(options.dateFrom) : null;
            const skipDuplicates = options?.skipDuplicates ?? true;
            while (hasMore && (!limit || allWarranties.length < limit)) {
                const params = {
                    status: statuses.join(','),
                    per_page: 100,
                    page,
                    orderby: 'date',
                    order: 'desc',
                };
                if (dateFrom) {
                    params.after = dateFrom.toISOString();
                }
                const response = await api.get('/orders', { params });
                const orders = response.data;
                if (orders.length === 0) {
                    hasMore = false;
                    break;
                }
                for (const order of orders) {
                    if (dateFrom) {
                        const orderDate = new Date(order.date_created);
                        if (orderDate < dateFrom) {
                            continue;
                        }
                    }
                    try {
                        for (let i = 0; i < order.line_items.length; i++) {
                            if (skipDuplicates) {
                                const existing = await this.warrantiesRepository.findOne({
                                    where: {
                                        order_id: order.id,
                                        order_line_index: i,
                                    },
                                });
                                if (existing) {
                                    skipped.push({ orderId: order.id, lineIndex: i });
                                    continue;
                                }
                            }
                            const warranty = await this.createWarrantyFromOrder(order.id, i, statuses);
                            allWarranties.push(warranty);
                            if (limit && allWarranties.length >= limit) {
                                hasMore = false;
                                break;
                            }
                        }
                    }
                    catch (error) {
                        if (error.message?.includes('already exists')) {
                            skipped.push({ orderId: order.id });
                        }
                        else {
                            this.logger.error(`Failed to process order ${order.id}:`, error.message);
                        }
                    }
                    if (limit && allWarranties.length >= limit) {
                        hasMore = false;
                        break;
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
                skipped: skipped.length,
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
        warranties_service_1.WarrantiesService,
        settings_service_1.SettingsService])
], WooCommerceService);
//# sourceMappingURL=woocommerce.service.js.map