import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { randomBytes, randomInt } from 'crypto';
import { EntityManager, Repository } from 'typeorm';
import { SmsService } from '../sms/sms.service';
import { SmsStatus } from '../sms/entities/sms-log.entity';
import { TradeInQuote } from './entities/trade-in-quote.entity';
import { TradeInVoucher } from './entities/trade-in-voucher.entity';
import { Cron } from '@nestjs/schedule';

const VOUCHER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const generateVoucherCode = () => {
  let code: string;
  do {
    code = Array.from({ length: 8 }, () => VOUCHER_ALPHABET[randomInt(VOUCHER_ALPHABET.length)]).join('');
  } while (!/[A-Z]/.test(code) || !/[2-9]/.test(code));
  return code;
};

@Injectable()
export class TradeInVoucherService {
  constructor(
    @InjectRepository(TradeInVoucher) private readonly vouchers: Repository<TradeInVoucher>,
    @InjectRepository(TradeInQuote) private readonly quotes: Repository<TradeInQuote>,
    private readonly sms: SmsService,
    private readonly config: ConfigService,
  ) {}

  async issue(manager: EntityManager, quoteId: number, amount: number): Promise<void> {
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('Voucher amount must be positive.');
    if (await manager.findOne(TradeInVoucher, { where: { quote_id: quoteId } })) return;
    let code: string;
    do {
      code = generateVoucherCode();
    } while (await manager.findOne(TradeInVoucher, { where: { code } }));
    const expires = new Date();
    expires.setUTCDate(expires.getUTCDate() + 30);
    await manager.save(TradeInVoucher, {
      quote_id: quoteId,
      code,
      public_token: randomBytes(32).toString('base64url'),
      amount: amount.toFixed(2),
      expires_at: expires,
      sms_status: 'pending',
      sms_attempt_count: 0,
    });
  }

  private view(voucher: TradeInVoucher) {
    const status = voucher.redeemed_at ? 'used' : voucher.expires_at.getTime() <= Date.now() ? 'expired' : 'active';
    return {
      code: voucher.code, amount: Number(voucher.amount), expires_at: voucher.expires_at,
      status, redeemed_at: voucher.redeemed_at,
    };
  }

  async publicView(token: string) {
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new NotFoundException('Voucher not found.');
    const voucher = await this.vouchers.findOne({ where: { public_token: token } });
    if (!voucher) throw new NotFoundException('Voucher not found.');
    return this.view(voucher);
  }

  async adminView(quoteId: number) {
    const voucher = await this.vouchers.findOne({ where: { quote_id: quoteId } });
    if (!voucher) return null;
    return {
      ...this.view(voucher), public_url: this.url(voucher), sms_status: voucher.sms_status,
      sms_attempt_count: voucher.sms_attempt_count, sms_last_attempt_at: voucher.sms_last_attempt_at,
    };
  }

  private url(voucher: TradeInVoucher) {
    const origin = (this.config.get<string>('PUBLIC_SITE_URL') || 'https://zezva.ge').replace(/\/+$/, '');
    return `${origin}/trade-in/voucher/${voucher.public_token}`;
  }

  async send(quoteId: number, resend = false) {
    const voucher = await this.vouchers.findOne({ where: { quote_id: quoteId } });
    if (!voucher) throw new NotFoundException('Voucher not found.');
    if (voucher.redeemed_at || voucher.expires_at.getTime() <= Date.now()) throw new BadRequestException('Voucher is no longer active.');
    if (voucher.sms_status === 'sent' && !resend) return this.adminView(quoteId);
    const quote = await this.quotes.findOne({ where: { id: quoteId } });
    if (!quote?.customer_phone) throw new BadRequestException('Customer phone is missing.');
    // Claim before the network call so concurrent requests cannot send duplicates.
    const stale = new Date(Date.now() - 5 * 60 * 1000);
    const claimed = await this.vouchers.createQueryBuilder().update(TradeInVoucher)
      .set({ sms_status: 'sending', sms_attempt_count: () => 'sms_attempt_count + 1', sms_last_attempt_at: new Date() })
      .where('id = :id AND (sms_status != :sending OR sms_last_attempt_at < :stale)', { id: voucher.id, sending: 'sending', stale })
      .andWhere(resend ? '1 = 1' : 'sms_status != :sent', { sent: 'sent' }).execute();
    if (!claimed.affected) return this.adminView(quoteId);
    try {
      const log = await this.sms.sendSms({
        phone: quote.customer_phone, templateKey: 'sms.trade_in.voucher',
        variables: {
          voucher_code: voucher.code, voucher_url: this.url(voucher),
          amount: Number(voucher.amount).toFixed(2), expires_at: voucher.expires_at.toISOString().slice(0, 10),
        },
      });
      await this.vouchers.update(voucher.id, { sms_status: log.status === SmsStatus.SENT ? 'sent' : log.status === SmsStatus.SKIPPED ? 'skipped' : 'failed' });
    } catch {
      await this.vouchers.update(voucher.id, { sms_status: 'failed' });
    }
    return this.adminView(quoteId);
  }

  @Cron('0 */10 * * * *')
  async retryUnsent() {
    const rows = await this.vouchers.createQueryBuilder('voucher')
      .where('voucher.sms_status IN (:...statuses)', { statuses: ['pending', 'failed', 'sending'] })
      .andWhere('voucher.sms_attempt_count < :max', { max: 5 })
      .andWhere('voucher.expires_at > :now', { now: new Date() })
      .andWhere('(voucher.sms_last_attempt_at IS NULL OR voucher.sms_last_attempt_at < :stale)', { stale: new Date(Date.now() - 5 * 60 * 1000) })
      .andWhere('voucher.redeemed_at IS NULL')
      .orderBy('voucher.id', 'ASC').limit(25).getMany();
    for (const row of rows) await this.send(row.quote_id).catch(() => undefined);
  }

  async redeem(quoteId: number, userId: number) {
    const result = await this.vouchers.createQueryBuilder().update(TradeInVoucher)
      .set({ redeemed_at: new Date(), redeemed_by_user_id: userId })
      .where('quote_id = :quoteId AND redeemed_at IS NULL AND expires_at > :now', { quoteId, now: new Date() }).execute();
    if (!result.affected) throw new BadRequestException('Voucher is missing, used or expired.');
    return this.adminView(quoteId);
  }
}
