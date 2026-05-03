import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import { Warranty, CreatedSource } from '../warranties/entities/warranty.entity';
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

interface SyncProgressState {
  total: number;
  processed: number;
  imported: number;
  skipped: number;
  status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled';
  message?: string;
  error?: string;
  result?: any;
  cancelRequested?: boolean;
}

@Injectable()
export class WooCommerceService {
  private readonly logger = new Logger(WooCommerceService.name);
  private api: AxiosInstance | null = null;
  private baseUrl: string | null = null;
  private lastApiKeyHash: string | null = null;
  private syncProgress: Map<string, SyncProgressState> = new Map();

  constructor(
    private configService: ConfigService,
    @InjectRepository(Warranty)
    private warrantiesRepository: Repository<Warranty>,
    private warrantiesService: WarrantiesService,
    private settingsService: SettingsService,
  ) {
    // Don't initialize in constructor - wait for first use to check settings
  }

  private async getApi(): Promise<AxiosInstance> {
    // Always try to get from settings first (in case settings were updated)
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
      
      const baseUrl = apiKeys.woocommerce_url || this.configService.get<string>('WOOCOMMERCE_URL');
      const consumerKey = apiKeys.woocommerce_consumer_key || this.configService.get<string>('WOOCOMMERCE_CONSUMER_KEY');
      const consumerSecret = apiKeys.woocommerce_consumer_secret || this.configService.get<string>('WOOCOMMERCE_CONSUMER_SECRET');

      // Create a hash to detect changes
      const currentHash = `${baseUrl || ''}|${consumerKey || ''}|${consumerSecret ? '***' : ''}`;

      this.logger.log(`🔑 WooCommerce API check - URL: ${baseUrl ? `set (${baseUrl})` : 'missing'}, Key: ${consumerKey ? `set (${consumerKey.length} chars)` : 'missing'}, Secret: ${consumerSecret ? `set (${consumerSecret.length} chars)` : 'missing'}`);

      if (baseUrl && consumerKey && consumerSecret) {
        this.logger.log('✅ All WooCommerce API credentials found, initializing API...');
        // Normalize URL (remove trailing slash if present)
        const normalizedUrl = baseUrl.trim().replace(/\/$/, '');
        // Check if we need to reinitialize (credentials changed or not initialized)
        const needsReinit = !this.api || this.lastApiKeyHash !== currentHash;

        if (needsReinit) {
          this.baseUrl = normalizedUrl;
          this.lastApiKeyHash = currentHash;
          this.api = axios.create({
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
      } else {
        this.logger.error('❌ WooCommerce API keys incomplete in settings:', {
          hasBaseUrl: !!baseUrl,
          hasConsumerKey: !!consumerKey,
          hasConsumerSecret: !!consumerSecret,
          baseUrl: baseUrl || 'MISSING',
          consumerKey: consumerKey ? `${consumerKey.substring(0, 10)}...` : 'MISSING',
          consumerSecret: consumerSecret ? '***' : 'MISSING',
        });
      }
    } catch (error) {
      this.logger.error('Failed to get WooCommerce API from settings:', error);
      this.logger.error('Error details:', error.message, error.stack);
      
      // If API is already initialized from previous call, use it (but log warning)
      if (this.api) {
        this.logger.warn('Using cached WooCommerce API instance, but settings check failed');
        return this.api;
      }
      
      // Log what we found in settings
      this.logger.error('WooCommerce API initialization failed. Checking settings directly...');
      try {
        const directCheck = await this.settingsService.getApiKeys();
        this.logger.error('Direct settings check:', {
          hasUrl: !!directCheck.woocommerce_url,
          hasKey: !!directCheck.woocommerce_consumer_key,
          hasSecret: !!directCheck.woocommerce_consumer_secret,
          url: directCheck.woocommerce_url || 'MISSING',
        });
      } catch (checkError) {
        this.logger.error('Failed to check settings directly:', checkError);
      }
      
      throw new BadRequestException('WooCommerce API not configured. Please set WooCommerce API keys in Settings > API Keys.');
    }

    // If API is already initialized from previous call, use it (but log warning)
    if (this.api) {
      this.logger.warn('Using cached WooCommerce API instance, but settings check failed');
      return this.api;
    }

    throw new BadRequestException('WooCommerce API not configured. Please set WooCommerce API keys in Settings > API Keys.');
  }

  async getOrder(orderId: number): Promise<WooCommerceOrder> {
    const api = await this.getApi();
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch order ${orderId}:`, error.message);
      throw new BadRequestException(`Failed to fetch order from WooCommerce`);
    }
  }

  async getProduct(productId: number): Promise<WooCommerceProduct> {
    const api = await this.getApi();
    try {
      const response = await api.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch product ${productId}:`, error.message);
      throw new BadRequestException(`Failed to fetch product from WooCommerce`);
    }
  }

  private extractMetaDataValue(metaData: Array<{ key: string; value: string }>, key: string): string | null {
    const item = metaData.find((m) => m.key.toLowerCase() === key.toLowerCase());
    return item ? item.value : null;
  }

  private detectDeviceType(productName: string, sku: string): string {
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
    return 'Laptop'; // Default
  }

  async createWarrantyFromOrder(orderId: number, lineItemIndex: number = 0, allowedStatuses?: string[]): Promise<Warranty> {
    const order = await this.getOrder(orderId);

    // Check if order status is allowed (for manual import)
    if (allowedStatuses && !allowedStatuses.includes(order.status)) {
      throw new BadRequestException(`Order status ${order.status} is not allowed. Allowed statuses: ${allowedStatuses.join(', ')}`);
    }
    
    // For automatic webhook, only allow completed
    if (!allowedStatuses && order.status !== 'completed') {
      throw new BadRequestException('Can only create warranty for completed orders');
    }

    if (!order.line_items || order.line_items.length === 0) {
      throw new BadRequestException('Order has no line items');
    }

    const lineItem = order.line_items[lineItemIndex];
    if (!lineItem) {
      throw new BadRequestException(`Line item at index ${lineItemIndex} not found`);
    }

    // Check if warranty already exists for this order and line item
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

    // Get product details
    const product = await this.getProduct(lineItem.product_id);

    // Extract serial number and IMEI from meta data
    const serialNumber = this.extractMetaDataValue(lineItem.meta_data, 'serial_number') ||
                        this.extractMetaDataValue(lineItem.meta_data, 'serial') ||
                        this.extractMetaDataValue(product.meta_data, 'serial_number') ||
                        this.extractMetaDataValue(product.meta_data, 'serial');

    // If serial number is not found, generate one using order ID and product ID
    const finalSerialNumber = serialNumber || `ORD-${orderId}-PROD-${lineItem.product_id}-${lineItemIndex}`;

    const imei = this.extractMetaDataValue(lineItem.meta_data, 'imei') ||
                 this.extractMetaDataValue(product.meta_data, 'imei');

    const deviceType = this.detectDeviceType(product.name, product.sku);

    // Calculate warranty dates (default: 1 year from purchase)
    const purchaseDate = new Date(order.date_created);
    const warrantyStart = new Date(purchaseDate);
    const warrantyEnd = new Date(purchaseDate);
    warrantyEnd.setFullYear(warrantyEnd.getFullYear() + 2);

    // Get product price (use line item total or product price)
    const price = parseFloat(lineItem.meta_data.find(m => m.key === '_line_total')?.value || '0') ||
                  parseFloat(product.meta_data.find(m => m.key === '_price')?.value || '0') ||
                  0;

    if (price <= 500) {
      throw new BadRequestException('Warranty is created only for products above 500 GEL');
    }

    // Get thumbnail URL
    const thumbnailUrl = product.images && product.images.length > 0
      ? product.images[0].src
      : null;

    // Generate warranty ID using order ID and product ID
    const warrantyId = await this.warrantiesService.generateWarrantyId(
      CreatedSource.AUTO_WOO,
      orderId,
      lineItem.product_id,
    );

    // Create warranty
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
      created_source: CreatedSource.AUTO_WOO,
      extended_days: 0,
    });

    const savedWarranty = await this.warrantiesRepository.save(warranty);
    this.logger.log(`Created warranty ${savedWarranty.warranty_id} from order ${orderId}`);

    return savedWarranty;
  }

  async processOrderWebhook(orderId: number, status: string): Promise<void> {
    if (status !== 'completed') {
      this.logger.log(`Order ${orderId} status is ${status}, skipping warranty creation`);
      return;
    }

    // Check if WooCommerce automation is enabled
    const automationEnabled = await this.settingsService.get('WOOCOMMERCE_AUTOMATION_ENABLED');
    if (automationEnabled !== 'true') {
      this.logger.log(`WooCommerce automation is disabled, skipping order ${orderId}`);
      return;
    }

    try {
      const order = await this.getOrder(orderId);
      
      // Create warranties for all line items
      for (let i = 0; i < order.line_items.length; i++) {
        try {
          // Skip if already exists
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
        } catch (error) {
          this.logger.error(`Failed to create warranty for order ${orderId}, line item ${i}:`, error.message);
          // Continue with other line items even if one fails
        }
      }
    } catch (error) {
      this.logger.error(`Failed to process webhook for order ${orderId}:`, error.message);
      throw error;
    }
  }

  async syncOrder(orderId: number, allowedStatuses?: string[]): Promise<Warranty[]> {
    const order = await this.getOrder(orderId);
    const warranties: Warranty[] = [];

    for (let i = 0; i < order.line_items.length; i++) {
      try {
        const warranty = await this.createWarrantyFromOrder(orderId, i, allowedStatuses);
        warranties.push(warranty);
      } catch (error) {
        this.logger.error(`Failed to sync warranty for order ${orderId}, line item ${i}:`, error.message);
      }
    }

    return warranties;
  }

  getSyncProgress(jobId: string) {
    const progress = this.syncProgress.get(jobId);
    if (!progress) {
      return { status: 'not_found' };
    }
    return {
      ...progress,
      percentage: progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0,
    };
  }

  async cancelSync(jobId: string) {
    const progress = this.syncProgress.get(jobId);
    if (!progress) {
      throw new BadRequestException('Sync job not found');
    }

    if (['completed', 'error', 'cancelled'].includes(progress.status)) {
      return { success: false, message: 'Job already finished' };
    }

    progress.cancelRequested = true;
    progress.message = 'Cancellation requested...';
    this.syncProgress.set(jobId, progress);

    return { success: true };
  }

  async syncOrdersByStatus(
    statuses: string[],
    options?: {
      limit?: number;
      dateFrom?: string;
      skipDuplicates?: boolean;
    },
    jobId?: string,
  ) {
    const api = await this.getApi();

    if (!statuses || statuses.length === 0) {
      throw new BadRequestException('At least one order status must be specified');
    }

    const limit = options?.limit;
    const dateFrom = options?.dateFrom ? new Date(options.dateFrom) : null;
    const skipDuplicates = options?.skipDuplicates ?? true;

    const allWarranties: Warranty[] = [];
    const skipped: Array<{ orderId: number; lineIndex?: number }> = [];
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
      if (!jobId) return false;
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
        const params: any = {
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
        const orders: WooCommerceOrder[] = response.data;

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
            this.logger.log(
              `⏳ Progress: ${processedOrders} orders processed, ${allWarranties.length} warranties imported`,
            );
          }

          try {
            const lineItemResults = await Promise.all(
              order.line_items.map(async (lineItem, i) => {
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
                } catch (error) {
                  if (error.message?.includes('already exists')) {
                    skipped.push({ orderId: order.id, lineIndex: i });
                    return null;
                  }
                  throw error;
                }
              }),
            );

            const successfulWarranties = lineItemResults.filter(
              (warranty): warranty is Warranty => Boolean(warranty),
            );
            allWarranties.push(...successfulWarranties);
          } catch (error) {
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

      this.logger.log(
        `✅ Import complete! Processed: ${processedOrders} orders, Imported: ${allWarranties.length} warranties, Skipped: ${skipped.length}`,
      );

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
    } catch (error) {
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

      throw new BadRequestException(`Failed to sync orders: ${error.message}`);
    }
  }
}
