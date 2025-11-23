import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import { Warranty, CreatedSource } from '../warranties/entities/warranty.entity';
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

@Injectable()
export class WooCommerceService {
  private readonly logger = new Logger(WooCommerceService.name);
  private readonly api: AxiosInstance;
  private readonly baseUrl: string;
  private readonly consumerKey: string;
  private readonly consumerSecret: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Warranty)
    private warrantiesRepository: Repository<Warranty>,
    private warrantiesService: WarrantiesService,
  ) {
    this.baseUrl = this.configService.get<string>('WOOCOMMERCE_URL');
    this.consumerKey = this.configService.get<string>('WOOCOMMERCE_CONSUMER_KEY');
    this.consumerSecret = this.configService.get<string>('WOOCOMMERCE_CONSUMER_SECRET');

    if (!this.baseUrl || !this.consumerKey || !this.consumerSecret) {
      this.logger.warn('WooCommerce credentials not configured');
      return;
    }

    this.api = axios.create({
      baseURL: this.baseUrl,
      auth: {
        username: this.consumerKey,
        password: this.consumerSecret,
      },
      timeout: 30000,
    });
  }

  async getOrder(orderId: number): Promise<WooCommerceOrder> {
    try {
      const response = await this.api.get(`/wp-json/wc/v3/orders/${orderId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch order ${orderId}:`, error.message);
      throw new BadRequestException(`Failed to fetch order from WooCommerce`);
    }
  }

  async getProduct(productId: number): Promise<WooCommerceProduct> {
    try {
      const response = await this.api.get(`/wp-json/wc/v3/products/${productId}`);
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
    warrantyEnd.setFullYear(warrantyEnd.getFullYear() + 1);

    // Get product price (use line item total or product price)
    const price = parseFloat(lineItem.meta_data.find(m => m.key === '_line_total')?.value || '0') ||
                  parseFloat(product.meta_data.find(m => m.key === '_price')?.value || '0') ||
                  0;

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

    try {
      const order = await this.getOrder(orderId);
      
      // Create warranties for all line items
      for (let i = 0; i < order.line_items.length; i++) {
        try {
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

  async syncOrdersByStatus(statuses: string[], limit: number = 100) {
    if (!this.api) {
      throw new BadRequestException('WooCommerce not configured');
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

        const orders: WooCommerceOrder[] = response.data;

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
          } catch (error) {
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
    } catch (error) {
      this.logger.error('Failed to sync orders:', error.message);
      throw new BadRequestException(`Failed to sync orders: ${error.message}`);
    }
  }
}

