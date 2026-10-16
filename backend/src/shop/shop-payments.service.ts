import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { createHash, createVerify, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { SettingsService } from '../settings/settings.service';
import { ShopOrder, ShopOrderStatus } from './entities/shop-order.entity';
import { ShopPaymentAttempt } from './entities/shop-payment-attempt.entity';
import { ShopPaymentEvent } from './entities/shop-payment-event.entity';

const CALLBACK_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu4RUyAw3+CdkS3ZNILQhzHI9
Hemo+vKB9U2BSabppkKjzjjkf+0Sm76hSMiu/HFtYhqWOESryoCDJoqffY0Q1VNt25aT
xbj068QNUtnxQ7KQVLA+pG0smf+EBWlS1vBEAFbIas9d8c9b9sSEkTrrTYQ90WIM8bGB
6S/KLVoT1a7SnzabjoLc5Qf/SLDG5fu8dH8zckyeYKdRKSBJKvhxtcBuHV4f7qsynQT+
f2UYbESX/TLHwT5qFWZDHZ0YUOUIvb8n7JujVSGZO9/+ll/g4ZIWhC1MlJgPObDwRkRd
8NFOopgxMcMsDIZIoLbWKhHVq67hdbwpAq9K9WMmEhPnPwIDAQAB
-----END PUBLIC KEY-----`;

const hash = (value: string) => createHash('sha256').update(value).digest('hex');

@Injectable()
export class ShopPaymentsService {
  private readonly receiptChecks = new Map<number, number>();
  constructor(
    @InjectRepository(ShopOrder) private readonly orders: Repository<ShopOrder>,
    @InjectRepository(ShopPaymentAttempt) private readonly attempts: Repository<ShopPaymentAttempt>,
    @InjectRepository(ShopPaymentEvent) private readonly events: Repository<ShopPaymentEvent>,
    private readonly settings: SettingsService,
  ) {}

  async methods() {
    const [onsite, online, clientId, secret] = await Promise.all([
      this.settings.get('SHOP_PAY_ONSITE_ENABLED'),
      this.settings.get('SHOP_PAY_BOG_ENABLED'),
      this.settings.get('SHOP_BOG_CLIENT_ID'),
      this.settings.get('SHOP_BOG_CLIENT_SECRET'),
    ]);
    return { onsite: onsite !== 'false', online: online === 'true' && Boolean(clientId && secret) };
  }

  async adminSettings() {
    const [methods, clientId, secret] = await Promise.all([
      this.methods(), this.settings.get('SHOP_BOG_CLIENT_ID'), this.settings.get('SHOP_BOG_CLIENT_SECRET'),
    ]);
    return { ...methods, client_id: clientId || '', secret_configured: Boolean(secret) };
  }

  async updateSettings(input: { onsite?: boolean; online?: boolean; client_id?: string; client_secret?: string }) {
    if (typeof input.onsite !== 'boolean' || typeof input.online !== 'boolean') {
      throw new BadRequestException('Payment switches must be booleans.');
    }
    if (!input.onsite && !input.online) throw new BadRequestException('Keep at least one payment method enabled.');
    const clientId = input.client_id?.trim() || await this.settings.get('SHOP_BOG_CLIENT_ID');
    const secret = input.client_secret?.trim() || await this.settings.get('SHOP_BOG_CLIENT_SECRET');
    if (input.online && (!clientId || !secret)) throw new BadRequestException('BoG client ID and secret are required.');
    if (input.client_id !== undefined) await this.settings.set('SHOP_BOG_CLIENT_ID', clientId || '');
    if (input.client_secret?.trim()) await this.settings.set('SHOP_BOG_CLIENT_SECRET', secret || '');
    await this.settings.set('SHOP_PAY_ONSITE_ENABLED', String(input.onsite));
    await this.settings.set('SHOP_PAY_BOG_ENABLED', String(input.online));
    return this.adminSettings();
  }

  private async log(attempt: ShopPaymentAttempt, eventType: string, status: string, detail?: string) {
    await this.events.save(this.events.create({ attempt_id: attempt.id, shop_order_id: attempt.shop_order_id, event_type: eventType, status, detail: detail?.slice(0, 500) || null }));
  }

  async start(order: ShopOrder) {
    const clientId = await this.settings.get('SHOP_BOG_CLIENT_ID');
    const secret = await this.settings.get('SHOP_BOG_CLIENT_SECRET');
    if (!clientId || !secret || !(await this.methods()).online) throw new BadRequestException('Online payment is unavailable.');
    const returnToken = randomBytes(32).toString('hex');
    const attempt = await this.attempts.save(this.attempts.create({
      shop_order_id: order.id, idempotency_key: uuidv4(), return_token_hash: hash(returnToken),
      amount: order.total_amount, currency: 'GEL', status: 'created',
    }));
    await this.log(attempt, 'created', 'created');
    const base = (process.env.PORTAL_URL || 'https://zezva.ge').replace(/\/$/, '');
    const returnBase = `${base}/shop#payment_order=${encodeURIComponent(order.order_number)}&payment_token=${returnToken}`;
    try {
      const auth = await axios.post('https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token',
        'grant_type=client_credentials', { auth: { username: clientId, password: secret }, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 });
      const response = await axios.post('https://api.bog.ge/payments/v1/ecommerce/orders', {
        callback_url: `${base}/api/public/shop/payments/bog/callback`,
        external_order_id: order.order_number,
        purchase_units: { currency: 'GEL', total_amount: Number(order.total_amount), basket: order.items_json.map((item) => ({
          product_id: String(item.product_id), quantity: item.quantity, unit_price: item.unit_price,
        })) },
        redirect_urls: { success: `${returnBase}&payment_return=success`, fail: `${returnBase}&payment_return=fail` },
        payment_method: ['card'],
      }, { headers: { Authorization: `Bearer ${auth.data.access_token}`, 'Idempotency-Key': attempt.idempotency_key, 'Accept-Language': 'en' }, timeout: 20000 });
      const redirect = response.data?._links?.redirect?.href;
      const providerId = response.data?.id;
      const redirectHost = redirect ? new URL(redirect).hostname : '';
      if (!providerId || !redirect || new URL(redirect).protocol !== 'https:' || !(redirectHost === 'bog.ge' || redirectHost.endsWith('.bog.ge'))) throw new Error('BoG returned an invalid checkout link.');
      attempt.provider_order_id = String(providerId);
      attempt.redirect_url = redirect;
      attempt.status = 'pending';
      await this.attempts.save(attempt);
      await this.log(attempt, 'redirect_ready', 'pending');
      return { payment_redirect_url: redirect, payment_token: returnToken };
    } catch (error) {
      attempt.status = 'failed';
      attempt.last_error = axios.isAxiosError(error) ? `BoG request failed (${error.response?.status || 'network'})` : 'BoG checkout response was invalid';
      await this.attempts.save(attempt);
      await this.log(attempt, 'initiation_failed', 'failed', attempt.last_error);
      order.payment_status = 'failed';
      await this.orders.save(order);
      return { payment_error: 'Online payment could not be started. Please try again or contact us.' };
    }
  }

  async callback(raw: Buffer | undefined, signature: string | undefined) {
    if (!raw || !signature) throw new UnauthorizedException('Invalid BoG callback.');
    const verifier = createVerify('RSA-SHA256');
    verifier.update(raw);
    verifier.end();
    if (!verifier.verify(CALLBACK_PUBLIC_KEY, Buffer.from(signature, 'base64'))) throw new UnauthorizedException('Invalid BoG callback.');
    let payload: any;
    try { payload = JSON.parse(raw.toString('utf8')); } catch { throw new BadRequestException('Invalid callback JSON.'); }
    if (payload?.event !== 'order_payment' || !payload?.body?.order_id) throw new BadRequestException('Unknown callback event.');
    const attempt = await this.attempts.findOne({ where: { provider_order_id: String(payload.body.order_id) } });
    if (!attempt) throw new BadRequestException('Unknown BoG order.');
    const order = await this.orders.findOne({ where: { id: attempt.shop_order_id } });
    if (!order || payload.body.external_order_id !== order.order_number ||
      Number(payload.body.purchase_units?.request_amount) !== Number(attempt.amount) ||
      payload.body.purchase_units?.currency_code !== 'GEL') {
      await this.log(attempt, 'callback_mismatch', attempt.status);
      throw new BadRequestException('Payment does not match the shop order.');
    }
    const state = String(payload.body.order_status?.key || '').toLowerCase();
    if (attempt.status === 'paid' && state === 'completed') return { received: true };
    if (state === 'completed') {
      attempt.status = 'paid';
      order.payment_status = 'paid';
      order.paid_at = new Date();
      order.status = ShopOrderStatus.PROCESSING;
      await this.orders.save(order);
    } else if (state === 'rejected' && order.payment_status !== 'paid') {
      attempt.status = 'failed';
      order.payment_status = 'failed';
      await this.orders.save(order);
    } else if (state === 'refunded' || state === 'refunded_partially') {
      attempt.status = state;
      order.payment_status = state;
      await this.orders.save(order);
    } else if (order.payment_status !== 'paid') attempt.status = 'pending';
    await this.attempts.save(attempt);
    await this.log(attempt, 'callback', attempt.status, state);
    return { received: true };
  }

  async publicStatus(orderNumber: string, token: string) {
    const order = await this.orders.findOne({ where: { order_number: orderNumber } });
    if (!order) throw new UnauthorizedException();
    const attempt = await this.attempts.findOne({ where: { shop_order_id: order.id, return_token_hash: hash(token || '') } });
    if (!attempt) throw new UnauthorizedException();
    if (order.payment_status === 'pending' && attempt.provider_order_id && Date.now() - (this.receiptChecks.get(attempt.id) || 0) > 10000) {
      this.receiptChecks.set(attempt.id, Date.now());
      try {
        const clientId = await this.settings.get('SHOP_BOG_CLIENT_ID');
        const secret = await this.settings.get('SHOP_BOG_CLIENT_SECRET');
        if (clientId && secret) {
          const auth = await axios.post('https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token', 'grant_type=client_credentials', {
            auth: { username: clientId, password: secret }, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000,
          });
          const receipt = await axios.get(`https://api.bog.ge/payments/v1/receipt/${encodeURIComponent(attempt.provider_order_id)}`, {
            headers: { Authorization: `Bearer ${auth.data.access_token}` }, timeout: 10000,
          });
          const body = receipt.data;
          if (String(body.order_id) === attempt.provider_order_id && body.external_order_id === order.order_number &&
              Number(body.purchase_units?.request_amount) === Number(attempt.amount) && body.purchase_units?.currency_code === 'GEL') {
            const status = body.order_status?.key;
            if (status === 'completed' || status === 'rejected') {
              attempt.status = status === 'completed' ? 'paid' : 'failed';
              order.payment_status = attempt.status;
              if (status === 'completed') { order.status = ShopOrderStatus.PROCESSING; order.paid_at = new Date(); }
              await this.orders.save(order);
              await this.attempts.save(attempt);
              await this.log(attempt, 'receipt_verified', attempt.status);
            }
          }
        }
      } catch { /* Keep pending until a signed callback or a verified receipt is available. */ }
    }
    return { order_number: order.order_number, payment_status: order.payment_status, total_amount: Number(order.total_amount) };
  }

  async orderHistory(orderId: number) {
    const attempts = await this.attempts.find({ where: { shop_order_id: orderId }, order: { id: 'DESC' } });
    const events = await this.events.find({ where: { shop_order_id: orderId }, order: { id: 'DESC' } });
    return { attempts: attempts.map(({ return_token_hash, redirect_url, idempotency_key, ...safe }) => safe), events };
  }

  async hasAttempts(orderId: number) {
    return (await this.attempts.count({ where: { shop_order_id: orderId } })) > 0;
  }
}
