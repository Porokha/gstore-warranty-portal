import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettingsService } from '../settings/settings.service';
import { SmsService } from '../sms/sms.service';
import { Warranty, CreatedSource } from '../warranties/entities/warranty.entity';
import { WarrantiesService } from '../warranties/warranties.service';
import { PosOrderUpsertDto } from './dto/pos-order-upsert.dto';
import {
  PosWarrantyInboundEvent,
  PosWarrantyInboundEventStatus,
} from './entities/pos-warranty-inbound-event.entity';

type PosOrderUpsertAction = 'created' | 'updated' | 'ignored' | 'deferred';
type MobileSentrixCredentials = {
  baseUrl: string;
  consumerName: string;
  consumerKey: string;
  consumerSecret: string;
  accessToken: string;
  accessTokenSecret: string;
};

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);
  private readonly eligibleNonPreorderStatuses = new Set(['pos-success', 'completed']);
  private readonly minimumWarrantyPrice = 500;
  private readonly warrantyYears = 2;
  private readonly mobileSentrixCallbackPath = '/api/integrations/mobilesentrix/oauth/callback';
  private readonly mobileSentrixWebhookPath = '/api/integrations/mobilesentrix/webhook';

  constructor(
    @InjectRepository(PosWarrantyInboundEvent)
    private posInboundEventsRepository: Repository<PosWarrantyInboundEvent>,
    @InjectRepository(Warranty)
    private warrantiesRepository: Repository<Warranty>,
    private settingsService: SettingsService,
    private smsService: SmsService,
    private warrantiesService: WarrantiesService,
    private configService: ConfigService,
  ) {}

  async assertPosWebhookAuthorization(authorizationHeader?: string): Promise<void> {
    const secret =
      (await this.settingsService.get('POS_WARRANTY_WEBHOOK_SECRET')) ||
      this.configService.get<string>('POS_WARRANTY_WEBHOOK_SECRET') ||
      '';

    if (!secret) {
      throw new ServiceUnavailableException('POS warranty webhook secret is not configured');
    }

    const bearer = authorizationHeader?.trim() || '';
    if (!bearer.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = bearer.slice(7).trim();
    if (!token || token !== secret) {
      throw new UnauthorizedException('Invalid bearer token');
    }
  }

  async connectMobileSentrix(): Promise<{
    success: true;
    connected: true;
    base_url: string;
    callback_url: string;
    webhook_url: string;
  }> {
    const config = await this.getMobileSentrixBaseConfig();

    const authorizeUrl = `${config.baseUrl}/oauth/authorize/identifier`;
    const callbackUrl = this.getMobileSentrixCallbackUrl();

    const authorizeResponse = await axios.get(authorizeUrl, {
      params: {
        consumer: config.consumerName,
        authtype: 1,
        flowentry: 'SignIn',
        consumer_key: config.consumerKey,
        consumer_secret: config.consumerSecret,
        callback: callbackUrl,
      },
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    const redirectLocation =
      (typeof authorizeResponse.headers.location === 'string' && authorizeResponse.headers.location) ||
      authorizeResponse.request?.res?.headers?.location ||
      authorizeResponse.request?.path;

    if (!redirectLocation) {
      throw new ServiceUnavailableException(
        'MobileSentrix did not return the OAuth redirect location.',
      );
    }

    const callbackData = this.extractMobileSentrixOAuthParams(redirectLocation, callbackUrl);
    const exchangeResult = await this.exchangeMobileSentrixAccessToken({
      ...config,
      oauthToken: callbackData.oauthToken,
      oauthVerifier: callbackData.oauthVerifier,
    });

    await this.settingsService.setApiKeys({
      mobilesentrix_access_token: exchangeResult.accessToken,
      mobilesentrix_access_token_secret: exchangeResult.accessTokenSecret,
    });

    return {
      success: true,
      connected: true,
      base_url: config.baseUrl,
      callback_url: callbackUrl,
      webhook_url: this.getMobileSentrixWebhookUrl(),
    };
  }

  async completeMobileSentrixOAuthFromCallback(
    oauthToken?: string,
    oauthVerifier?: string,
  ): Promise<void> {
    if (!oauthToken || !oauthVerifier) {
      throw new BadRequestException('Missing oauth_token or oauth_verifier');
    }

    const config = await this.getMobileSentrixBaseConfig();
    const exchangeResult = await this.exchangeMobileSentrixAccessToken({
      ...config,
      oauthToken,
      oauthVerifier,
    });

    await this.settingsService.setApiKeys({
      mobilesentrix_access_token: exchangeResult.accessToken,
      mobilesentrix_access_token_secret: exchangeResult.accessTokenSecret,
    });
  }

  async testMobileSentrixSearch(query: string): Promise<{
    success: true;
    query: string;
    total_items: number;
    categories_count: number;
    items_count: number;
    first_items: Array<Record<string, any>>;
  }> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      throw new BadRequestException('Search query is required');
    }

    const config = await this.getMobileSentrixCredentials();
    const response = await axios.get(`${config.baseUrl}/api/rest/searchproduct`, {
      params: {
        q: normalizedQuery,
        max_results: 5,
        start_index: 0,
      },
      headers: {
        Authorization: this.buildMobileSentrixOAuthHeader(config),
        Accept: 'application/json',
      },
      validateStatus: (status) => status >= 200 && status < 500,
    });

    if (response.status >= 400) {
      throw new HttpException(
        response.data?.message || 'MobileSentrix search request failed',
        response.status,
      );
    }

    const data = response.data?.data || {};
    const items = Array.isArray(data.items) ? data.items : [];
    const categories = Array.isArray(data.categories) ? data.categories : [];

    return {
      success: true,
      query: normalizedQuery,
      total_items: Number(data.total_items || items.length || 0),
      categories_count: categories.length,
      items_count: items.length,
      first_items: items,
    };
  }

  async handlePosOrderUpsert(payload: PosOrderUpsertDto) {
    if (payload.event_type !== 'order_upserted') {
      throw new BadRequestException('Unsupported event_type. Only order_upserted is accepted.');
    }

    let eventRecord = await this.posInboundEventsRepository.findOne({
      where: { event_id: payload.event_id },
    });

    if (eventRecord?.processing_status === PosWarrantyInboundEventStatus.PROCESSED) {
      return this.buildResponse(
        eventRecord.action_taken as PosOrderUpsertAction,
        payload.woo_order_id,
        eventRecord.warranty_number || undefined,
      );
    }

    if (!eventRecord) {
      eventRecord = this.posInboundEventsRepository.create({
        event_id: payload.event_id,
        event_type: payload.event_type,
        source: payload.source,
        woo_order_id: payload.woo_order_id,
        analytics_order_id: payload.analytics_order_id ?? null,
        payload: JSON.stringify(payload),
        processing_status: PosWarrantyInboundEventStatus.RECEIVED,
      });
    } else {
      eventRecord.event_type = payload.event_type;
      eventRecord.source = payload.source;
      eventRecord.woo_order_id = payload.woo_order_id;
      eventRecord.analytics_order_id = payload.analytics_order_id ?? null;
      eventRecord.payload = JSON.stringify(payload);
      eventRecord.error_message = null;
      eventRecord.external_response = null;
      eventRecord.action_taken = null;
      eventRecord.warranty_number = null;
      eventRecord.processing_status = PosWarrantyInboundEventStatus.RECEIVED;
      eventRecord.processed_at = null;
    }

    await this.posInboundEventsRepository.save(eventRecord);

    try {
      const result = await this.processPosOrderSnapshot(payload);
      eventRecord.processing_status = PosWarrantyInboundEventStatus.PROCESSED;
      eventRecord.action_taken = result.action;
      eventRecord.warranty_number = result.warrantyNumber || null;
      eventRecord.external_response = JSON.stringify(
        this.buildResponse(result.action, payload.woo_order_id, result.warrantyNumber),
      );
      eventRecord.processed_at = new Date();
      await this.posInboundEventsRepository.save(eventRecord);

      return this.buildResponse(result.action, payload.woo_order_id, result.warrantyNumber);
    } catch (error) {
      eventRecord.processing_status = PosWarrantyInboundEventStatus.FAILED;
      eventRecord.error_message = error.message || 'Unknown processing error';
      eventRecord.processed_at = new Date();
      await this.posInboundEventsRepository.save(eventRecord);
      throw error;
    }
  }

  private async processPosOrderSnapshot(
    payload: PosOrderUpsertDto,
  ): Promise<{ action: PosOrderUpsertAction; warrantyNumber?: string }> {
    const hasPreorder = Boolean(payload.has_preorder);
    const preorderFinished = (payload.preorder_status || '').toLowerCase() === 'finished';
    const eligibleStatus = this.eligibleNonPreorderStatuses.has((payload.order_status || '').toLowerCase());
    const price = this.resolvePrice(payload);

    if (hasPreorder && !preorderFinished) {
      return { action: 'deferred' };
    }

    if (!hasPreorder && !eligibleStatus) {
      return { action: 'ignored' };
    }

    if (price <= this.minimumWarrantyPrice) {
      return { action: 'ignored' };
    }

    const existingWarranty = await this.warrantiesRepository.findOne({
      where: { order_id: payload.woo_order_id },
    });

    const warrantyData = this.mapPayloadToWarranty(payload);

    if (existingWarranty) {
      Object.assign(existingWarranty, warrantyData, {
        purchase_date: new Date(warrantyData.purchase_date),
        warranty_start: new Date(warrantyData.warranty_start),
        warranty_end: new Date(warrantyData.warranty_end),
      });
      const saved = await this.warrantiesRepository.save(existingWarranty);
      this.logger.log(
        `Updated warranty ${saved.warranty_id} from POS order ${payload.woo_order_id}`,
      );
      return { action: 'updated', warrantyNumber: saved.warranty_id };
    }

    const warrantyId = await this.warrantiesService.generateWarrantyId(CreatedSource.AUTO_WOO);
    const warranty = this.warrantiesRepository.create({
      ...warrantyData,
      warranty_id: warrantyId,
      purchase_date: new Date(warrantyData.purchase_date),
      warranty_start: new Date(warrantyData.warranty_start),
      warranty_end: new Date(warrantyData.warranty_end),
    });
    const saved = await this.warrantiesRepository.save(warranty);
    this.logger.log(
      `Created warranty ${saved.warranty_id} from POS order ${payload.woo_order_id}`,
    );
    try {
      await this.smsService.notifyWarrantyCreated(saved);
    } catch (error) {
      this.logger.error(`Failed to send warranty created SMS for ${saved.warranty_id}:`, error.message);
    }
    return { action: 'created', warrantyNumber: saved.warranty_id };
  }

  private async getMobileSentrixBaseConfig(): Promise<{
    baseUrl: string;
    consumerName: string;
    consumerKey: string;
    consumerSecret: string;
  }> {
    const apiKeys = await this.settingsService.getApiKeys();
    const baseUrl = (apiKeys.mobilesentrix_api_url || 'https://preprod.mobilesentrix.eu')
      .trim()
      .replace(/\/+$/, '');
    const consumerName = (apiKeys.mobilesentrix_consumer_name || '').trim();
    const consumerKey = (apiKeys.mobilesentrix_consumer_key || '').trim();
    const consumerSecret = (apiKeys.mobilesentrix_consumer_secret || '').trim();

    if (!consumerName || !consumerKey || !consumerSecret) {
      throw new ServiceUnavailableException(
        'MobileSentrix consumer credentials are not configured.',
      );
    }

    return { baseUrl, consumerName, consumerKey, consumerSecret };
  }

  private async getMobileSentrixCredentials(): Promise<MobileSentrixCredentials> {
    const apiKeys = await this.settingsService.getApiKeys();
    const baseConfig = await this.getMobileSentrixBaseConfig();
    const accessToken = (apiKeys.mobilesentrix_access_token || '').trim();
    const accessTokenSecret = (apiKeys.mobilesentrix_access_token_secret || '').trim();

    if (!accessToken || !accessTokenSecret) {
      throw new NotFoundException(
        'MobileSentrix is not connected yet. Complete OAuth first.',
      );
    }

    return {
      ...baseConfig,
      accessToken,
      accessTokenSecret,
    };
  }

  private async exchangeMobileSentrixAccessToken(input: {
    baseUrl: string;
    consumerName: string;
    consumerKey: string;
    consumerSecret: string;
    oauthToken: string;
    oauthVerifier: string;
  }): Promise<{ accessToken: string; accessTokenSecret: string }> {
    const response = await axios.post(
      `${input.baseUrl}/oauth/authorize/identifiercallback`,
      {
        consumer_key: input.consumerKey,
        consumer_secret: input.consumerSecret,
        oauth_token: input.oauthToken,
        oauth_verifier: input.oauthVerifier,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        validateStatus: (status) => status >= 200 && status < 500,
      },
    );

    if (response.status >= 400 || response.data?.status !== 1) {
      throw new ServiceUnavailableException(
        response.data?.message || 'MobileSentrix access token exchange failed.',
      );
    }

    const accessToken = response.data?.data?.access_token;
    const accessTokenSecret = response.data?.data?.access_token_secret;

    if (!accessToken || !accessTokenSecret) {
      throw new ServiceUnavailableException(
        'MobileSentrix did not return access token credentials.',
      );
    }

    return { accessToken, accessTokenSecret };
  }

  private extractMobileSentrixOAuthParams(
    redirectLocation: string,
    fallbackBaseUrl: string,
  ): { oauthToken: string; oauthVerifier: string } {
    const parsed = new URL(redirectLocation, fallbackBaseUrl);
    const oauthToken = parsed.searchParams.get('oauth_token') || '';
    const oauthVerifier = parsed.searchParams.get('oauth_verifier') || '';

    if (!oauthToken || !oauthVerifier) {
      throw new ServiceUnavailableException(
        'MobileSentrix OAuth redirect did not include oauth_token and oauth_verifier.',
      );
    }

    return { oauthToken, oauthVerifier };
  }

  private buildMobileSentrixOAuthHeader(credentials: MobileSentrixCredentials): string {
    const nonce = Math.random().toString(36).slice(2, 14);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = `${credentials.consumerSecret}&${credentials.accessTokenSecret}`;
    const values = {
      oauth_consumer_key: credentials.consumerKey,
      oauth_token: credentials.accessToken,
      oauth_signature_method: 'PLAINTEXT',
      oauth_signature: signature,
      oauth_timestamp: timestamp,
      oauth_nonce: nonce,
      oauth_version: '1.0a',
    };

    return `OAuth ${Object.entries(values)
      .map(([key, value]) => `${key}="${encodeURIComponent(value)}"`)
      .join(', ')}`;
  }

  getMobileSentrixCallbackUrl(): string {
    return `${this.getPortalBaseUrl()}${this.mobileSentrixCallbackPath}`;
  }

  getMobileSentrixWebhookUrl(): string {
    return `${this.getPortalBaseUrl()}${this.mobileSentrixWebhookPath}`;
  }

  private getPortalBaseUrl(): string {
    return (this.configService.get<string>('PORTAL_URL') || 'https://zezva.ge').replace(/\/+$/, '');
  }

  private mapPayloadToWarranty(payload: PosOrderUpsertDto) {
    const purchaseDate = this.resolvePurchaseDate(payload);
    const warrantyEnd = new Date(purchaseDate);
    warrantyEnd.setFullYear(warrantyEnd.getFullYear() + this.warrantyYears);

    const [firstName, ...restNames] = (payload.customer.name || '').trim().split(/\s+/);
    const lastName = restNames.join(' ').trim() || '-';
    const fallbackSku = `POS-${payload.woo_order_id}`;
    const serialNumber =
      payload.item.serial?.trim() ||
      payload.item.imei?.trim() ||
      payload.item.sku?.trim() ||
      `POS-ORDER-${payload.woo_order_id}`;

    return {
      order_id: payload.woo_order_id,
      product_id: payload.analytics_order_id ?? null,
      order_line_index: 0,
      sku: payload.item.sku?.trim() || fallbackSku,
      imei: payload.item.imei?.trim() || null,
      serial_number: serialNumber,
      device_type: this.detectDeviceType(payload.item.product_name, payload.item.category, payload.item.sku),
      title: payload.item.product_name.trim(),
      thumbnail_url: null,
      price: this.resolvePrice(payload),
      brand: payload.item.brand?.trim() || null,
      model: null,
      condition: payload.item.condition?.trim() || null,
      personal_identification_number: payload.customer.personal_number?.trim() || null,
      admin_notes: this.buildAdminNotes(payload),
      customer_name: firstName || payload.customer.name.trim(),
      customer_last_name: lastName,
      customer_phone: payload.customer.phone.trim(),
      customer_email: payload.customer.email?.trim() || null,
      purchase_date: purchaseDate.toISOString(),
      warranty_start: purchaseDate.toISOString(),
      warranty_end: warrantyEnd.toISOString(),
      created_source: CreatedSource.AUTO_WOO,
      extended_days: 0,
    };
  }

  private resolvePurchaseDate(payload: PosOrderUpsertDto): Date {
    const sourceDate = payload.ordered_at || payload.event_time;
    const parsed = new Date(sourceDate);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('ordered_at/event_time is invalid');
    }
    return parsed;
  }

  private resolvePrice(payload: PosOrderUpsertDto): number {
    const candidates = [
      payload.item.sold_price,
      payload.totals?.paid_amount,
      payload.totals?.total_paid,
    ];

    for (const value of candidates) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
    }

    return 0;
  }

  private detectDeviceType(productName?: string, category?: string, sku?: string): string {
    const haystack = `${productName || ''} ${category || ''} ${sku || ''}`.toLowerCase();
    if (haystack.includes('phone') || haystack.includes('iphone') || haystack.includes('smart')) {
      return 'Phone';
    }
    if (haystack.includes('tablet') || haystack.includes('ipad')) {
      return 'Tablet';
    }
    if (haystack.includes('desktop') || haystack.includes('pc')) {
      return 'Desktop';
    }
    if (haystack.includes('watch')) {
      return 'Watch';
    }
    return 'Laptop';
  }

  private buildAdminNotes(payload: PosOrderUpsertDto): string {
    const parts = [
      `Source: ${payload.source}`,
      payload.order_number ? `Order number: ${payload.order_number}` : null,
      payload.analytics_order_id ? `Analytics order ID: ${payload.analytics_order_id}` : null,
      payload.payment_type ? `Payment type: ${payload.payment_type}` : null,
      `Warranty rule: > ${this.minimumWarrantyPrice} GEL, ${this.warrantyYears} years`,
      payload.staff?.cashier ? `Cashier: ${payload.staff.cashier}` : null,
      payload.staff?.salesperson ? `Salesperson: ${payload.staff.salesperson}` : null,
      payload.store?.name ? `Store: ${payload.store.name}` : null,
      payload.preorder_status ? `Preorder status: ${payload.preorder_status}` : null,
      payload.order_status ? `Order status: ${payload.order_status}` : null,
    ].filter(Boolean);

    return parts.join('\n');
  }

  private buildResponse(
    action: PosOrderUpsertAction,
    wooOrderId: number,
    warrantyNumber?: string,
  ) {
    return {
      success: true,
      received: true,
      action,
      external_reference: String(wooOrderId),
      warranty_number: warrantyNumber || null,
    };
  }
}
