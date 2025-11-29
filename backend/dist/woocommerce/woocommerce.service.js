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
        this.syncProgress = new Map();
    }
    async getApi() {
        this.logger.log('🔍 getApi() called - Checking WooCommerce API configuration...');
        try {
            const apiKeys = await this.settingsService.getApiKeys();
            this.logger.log('📋 Retrieved API keys from settings:', {
                hasUrl: !!apiKeys.woocommerce_url,
                hasKey: !!apiKeys.woocommerce_consumer_key,
                hasSecret: !!apiKeys.woocommerce_consumer_secret,
                url: apiKeys.woocommerce_url || 'MISSING',
                keyLength: apiKeys.woocommerce_consumer_key?.length || 0,
                secretLength: apiKeys.woocommerce_consumer_secret?.length || 0,
            });
            const baseUrl = apiKeys.woocommerce_url || this.configService.get('WOOCOMMERCE_URL');
            const consumerKey = apiKeys.woocommerce_consumer_key || this.configService.get('WOOCOMMERCE_CONSUMER_KEY');
            const consumerSecret = apiKeys.woocommerce_consumer_secret || this.configService.get('WOOCOMMERCE_CONSUMER_SECRET');
            const currentHash = `${baseUrl || ''}|${consumerKey || ''}|${consumerSecret ? '***' : ''}`;
            this.logger.log(`🔑 WooCommerce API check - URL: ${baseUrl ? `set (${baseUrl})` : 'missing'}, Key: ${consumerKey ? `set (${consumerKey.length} chars)` : 'missing'}, Secret: ${consumerSecret ? `set (${consumerSecret.length} chars)` : 'missing'}`);
            if (baseUrl && consumerKey && consumerSecret) {
                this.logger.log('✅ All WooCommerce API credentials found, initializing API...');
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
                this.logger.error('❌ WooCommerce API keys incomplete in settings:', {
                    hasBaseUrl: !!baseUrl,
                    hasConsumerKey: !!consumerKey,
                    hasConsumerSecret: !!consumerSecret,
                    baseUrl: baseUrl || 'MISSING',
                    consumerKey: consumerKey ? `${consumerKey.substring(0, 10)}...` : 'MISSING',
                    consumerSecret: consumerSecret ? '***' : 'MISSING',
                });
            }
        }
        catch (error) {
            this.logger.error('Failed to get WooCommerce API from settings:', error);
            this.logger.error('Error details:', error.message, error.stack);
            if (this.api) {
                this.logger.warn('Using cached WooCommerce API instance, but settings check failed');
                return this.api;
            }
            this.logger.error('WooCommerce API initialization failed. Checking settings directly...');
            try {
                const directCheck = await this.settingsService.getApiKeys();
                this.logger.error('Direct settings check:', {
                    hasUrl: !!directCheck.woocommerce_url,
                    hasKey: !!directCheck.woocommerce_consumer_key,
                    hasSecret: !!directCheck.woocommerce_consumer_secret,
                    url: directCheck.woocommerce_url || 'MISSING',
                });
            }
            catch (checkError) {
                this.logger.error('Failed to check settings directly:', checkError);
            }
            throw new common_1.BadRequestException('WooCommerce API not configured. Please set WooCommerce API keys in Settings > API Keys.');
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
    getSyncProgress(jobId) {
        const progress = this.syncProgress.get(jobId);
        if (!progress) {
            return { status: 'not_found' };
        }
        return {
            ...progress,
            percentage: progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0,
        };
    }
    async cancelSync(jobId) {
        const progress = this.syncProgress.get(jobId);
        if (!progress) {
            throw new common_1.BadRequestException('Sync job not found');
        }
        if (['completed', 'error', 'cancelled'].includes(progress.status)) {
            return { success: false, message: 'Job already finished' };
        }
        progress.cancelRequested = true;
        progress.message = 'Cancellation requested...';
        this.syncProgress.set(jobId, progress);
        return { success: true };
    }
    async syncOrdersByStatus(statuses, options, jobId) {
        const api = await this.getApi();
        if (!statuses || statuses.length === 0) {
            throw new common_1.BadRequestException('At least one order status must be specified');
        }
        const limit = options?.limit;
        const dateFrom = options?.dateFrom ? new Date(options.dateFrom) : null;
        const skipDuplicates = options?.skipDuplicates ?? true;
        const allWarranties = [];
        const skipped = [];
        let page = 1;
        let hasMore = true;
        let processedOrders = 0;
        if (jobId) {
            this.syncProgress.set(jobId, {
                total: limit || 0,
                processed: 0,
                imported: 0,
                skipped: 0,
                status: 'running',
                message: 'Import started',
                cancelRequested: false,
            });
        }
        const checkCancellation = () => {
            if (!jobId)
                return false;
            const progress = this.syncProgress.get(jobId);
            if (progress?.cancelRequested) {
                progress.status = 'cancelled';
                progress.message = 'Import cancelled by user';
                progress.result = {
                    success: false,
                    cancelled: true,
                    imported: allWarranties.length,
                    skipped: skipped.length,
                };
                this.syncProgress.set(jobId, progress);
                return true;
            }
            return false;
        };
        try {
            while (hasMore && (!limit || processedOrders < limit)) {
                const remaining = limit ? Math.max(limit - processedOrders, 0) : undefined;
                const perPage = remaining ? Math.min(remaining, 100) : 100;
                const params = {
                    status: statuses.join(','),
                    per_page: perPage,
                    page,
                    orderby: 'date',
                    order: 'desc',
                };
                if (dateFrom) {
                    params.after = dateFrom.toISOString();
                }
                this.logger.log(`📦 Fetching WooCommerce orders - Page ${page}...`);
                const response = await api.get('/orders', { params });
                const orders = response.data;
                if (orders.length === 0) {
                    hasMore = false;
                    break;
                }
                if (jobId && !limit) {
                    const headerTotal = Number(response.headers['x-wp-total']);
                    if (headerTotal) {
                        const progress = this.syncProgress.get(jobId);
                        if (progress && progress.total === 0) {
                            progress.total = headerTotal;
                            this.syncProgress.set(jobId, progress);
                        }
                    }
                }
                for (const order of orders) {
                    if (limit && processedOrders >= limit) {
                        hasMore = false;
                        break;
                    }
                    processedOrders++;
                    if (checkCancellation()) {
                        return {
                            success: false,
                            cancelled: true,
                            imported: allWarranties.length,
                            skipped: skipped.length,
                        };
                    }
                    if (dateFrom) {
                        const orderDate = new Date(order.date_created);
                        if (orderDate < dateFrom) {
                            continue;
                        }
                    }
                    if (processedOrders % 10 === 0) {
                        this.logger.log(`⏳ Progress: ${processedOrders} orders processed, ${allWarranties.length} warranties imported`);
                    }
                    try {
                        const lineItemResults = await Promise.all(order.line_items.map(async (lineItem, i) => {
                            if (skipDuplicates) {
                                const existing = await this.warrantiesRepository.findOne({
                                    where: {
                                        order_id: order.id,
                                        order_line_index: i,
                                    },
                                });
                                if (existing) {
                                    skipped.push({ orderId: order.id, lineIndex: i });
                                    return null;
                                }
                            }
                            try {
                                const warranty = await this.createWarrantyFromOrder(order.id, i, statuses);
                                return warranty;
                            }
                            catch (error) {
                                if (error.message?.includes('already exists')) {
                                    skipped.push({ orderId: order.id, lineIndex: i });
                                    return null;
                                }
                                throw error;
                            }
                        }));
                        const successfulWarranties = lineItemResults.filter((warranty) => Boolean(warranty));
                        allWarranties.push(...successfulWarranties);
                    }
                    catch (error) {
                        this.logger.error(`Failed to process order ${order.id}:`, error.message);
                    }
                    if (jobId) {
                        const progress = this.syncProgress.get(jobId);
                        if (progress) {
                            progress.processed = processedOrders;
                            progress.imported = allWarranties.length;
                            progress.skipped = skipped.length;
                            progress.message = `Processing order #${order.id}`;
                            this.syncProgress.set(jobId, progress);
                        }
                    }
                }
                page++;
                if (orders.length < perPage) {
                    hasMore = false;
                }
            }
            this.logger.log(`✅ Import complete! Processed: ${processedOrders} orders, Imported: ${allWarranties.length} warranties, Skipped: ${skipped.length}`);
            const finalResult = {
                success: true,
                imported: allWarranties.length,
                skipped: skipped.length,
                warranties: allWarranties,
            };
            if (jobId) {
                const progress = this.syncProgress.get(jobId);
                if (progress) {
                    progress.status = 'completed';
                    progress.processed = processedOrders;
                    progress.imported = allWarranties.length;
                    progress.skipped = skipped.length;
                    progress.result = finalResult;
                    progress.message = 'Import completed';
                    this.syncProgress.set(jobId, progress);
                }
            }
            return finalResult;
        }
        catch (error) {
            this.logger.error('Failed to sync orders:', error.message);
            if (jobId) {
                const progress = this.syncProgress.get(jobId);
                if (progress) {
                    progress.status = 'error';
                    progress.error = error.message;
                    progress.message = 'Import failed';
                    this.syncProgress.set(jobId, progress);
                }
            }
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