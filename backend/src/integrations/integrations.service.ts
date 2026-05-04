import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
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

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);
  private readonly eligibleNonPreorderStatuses = new Set(['pos-success', 'completed']);
  private readonly minimumWarrantyPrice = 500;
  private readonly warrantyYears = 2;

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
