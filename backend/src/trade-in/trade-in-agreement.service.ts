import { BadRequestException, GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { EntityManager, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { AgreementDetails, agreementTerms, makeAgreementPdf } from './trade-in-agreement.pdf';
import { TradeInAgreement } from './entities/trade-in-agreement.entity';
import { TradeInQuote, TradeInQuoteStatus } from './entities/trade-in-quote.entity';
import { TradeInStaffSignature } from './entities/trade-in-staff-signature.entity';
import { TradeInStaffSignatureProfile } from './entities/trade-in-staff-signature-profile.entity';
import { TradeInStaffSigningLink, StaffSigningPurpose } from './entities/trade-in-staff-signing-link.entity';
import { TradeInService } from './trade-in.service';
import { TradeInVoucherService } from './trade-in-voucher.service';

const detailKeys = [
  'seller_name', 'personal_id', 'phone', 'address', 'brand_model', 'storage', 'color',
  'imei', 'serial', 'included_items', 'defects', 'settlement_method', 'final_price',
] as const;
const currentTermsHash = createHash('sha256').update(JSON.stringify(agreementTerms)).digest('hex');

const signatureBuffer = (dataUrl: string): Buffer => {
  if (typeof dataUrl !== 'string' || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(dataUrl)) {
    throw new BadRequestException('A PNG signature is required.');
  }
  const bytes = Buffer.from(dataUrl.slice('data:image/png;base64,'.length), 'base64');
  if (bytes.length < 100 || bytes.length > 250000 || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    || bytes.toString('ascii', 12, 16) !== 'IHDR' || bytes.readUInt32BE(16) > 1600 || bytes.readUInt32BE(20) > 800
    || bytes.readUInt32BE(16) === 0 || bytes.readUInt32BE(20) === 0) {
    throw new BadRequestException('Invalid signature image.');
  }
  return bytes;
};

const requireCompleteDetails = (details: AgreementDetails) => {
  if (!details.seller_name || !/^\d{11}$/.test(details.personal_id) || !details.phone || !details.address || !details.brand_model
    || (!details.imei && !details.serial) || !details.color || !details.included_items || !details.defects
    || !Number.isFinite(details.final_price) || details.final_price <= 0) {
    throw new BadRequestException('Complete the seller, device and inspection details and enter a positive final price first.');
  }
};

@Injectable()
export class TradeInAgreementService {
  constructor(
    @InjectRepository(TradeInAgreement) private readonly agreements: Repository<TradeInAgreement>,
    @InjectRepository(TradeInQuote) private readonly quotes: Repository<TradeInQuote>,
    @InjectRepository(TradeInStaffSignature) private readonly staffSignatures: Repository<TradeInStaffSignature>,
    @InjectRepository(TradeInStaffSignatureProfile) private readonly signatureProfiles: Repository<TradeInStaffSignatureProfile>,
    @InjectRepository(TradeInStaffSigningLink) private readonly staffSigningLinks: Repository<TradeInStaffSigningLink>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly tradeInService: TradeInService,
    private readonly vouchers: TradeInVoucherService,
  ) {}

  private async quote(id: number) {
    const quote = await this.quotes.findOne({ where: { id } });
    if (!quote) throw new NotFoundException('Trade-in request not found.');
    return quote;
  }

  private async agreement(quoteId: number) {
    return this.agreements.createQueryBuilder('agreement')
      .addSelect(['agreement.customer_signature', 'agreement.representative_signature', 'agreement.signing_token_hash', 'agreement.pdf_data'])
      .where('agreement.quote_id = :quoteId', { quoteId }).getOne();
  }

  private lockedAgreement(manager: EntityManager, quoteId: number) {
    return manager.createQueryBuilder(TradeInAgreement, 'agreement')
      .addSelect(['agreement.customer_signature', 'agreement.representative_signature', 'agreement.signing_token_hash'])
      .where('agreement.quote_id = :quoteId', { quoteId }).setLock('pessimistic_write').getOne();
  }

  private async bonus(quote: TradeInQuote, price: number, method: string) {
    if (method !== 'gstore_credit') return 0;
    const selected = quote.pricing_path?.find((entry) => entry.label === 'gstore_product')?.answers?.[0]?.attributes?.[0]?.id;
    const product = selected ? (await this.tradeInService.listGstoreProducts(true)).find((item) => item.id === selected) : null;
    const policy = await this.tradeInService.getOfferPolicy();
    return Math.round(price * (product?.bonus_percent ?? policy.bonus_percent) / 100 + (product?.bonus_fixed ?? policy.bonus_fixed));
  }

  private async normalizeDetails(quote: TradeInQuote, raw: Record<string, unknown>, userId: number): Promise<AgreementDetails> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Representative not found.');
    const fields: Record<string, string> = {};
    for (const key of detailKeys) {
      if (key === 'final_price') continue;
      const value = raw[key];
      if (typeof value !== 'string' || value.length > 1000) throw new BadRequestException(`Invalid ${key}.`);
      fields[key] = value.trim();
    }
    if (!['cash', 'bank', 'gstore_credit'].includes(fields.settlement_method)) {
      throw new BadRequestException('Invalid settlement method.');
    }
    const price = Number(raw.final_price);
    if (!Number.isFinite(price) || price < 0 || price > 10000000) throw new BadRequestException('Invalid final price.');
    const finalPrice = Math.round(price * 100) / 100;
    return {
      ...fields,
      terms_hash: currentTermsHash,
      settlement_method: fields.settlement_method as AgreementDetails['settlement_method'],
      final_price: finalPrice,
      credit_bonus: await this.bonus(quote, finalPrice, fields.settlement_method),
      gstore_product: quote.pricing_path?.find((entry) => entry.label === 'gstore_product')?.answers?.[0]?.text || '',
      representative_name: `${user.name} ${user.last_name}`.trim(),
    } as AgreementDetails;
  }

  private view(agreement: TradeInAgreement) {
    return {
      id: agreement.id,
      quote_id: agreement.quote_id,
      details: agreement.details,
      customer_signed_at: agreement.customer_signed_at,
      representative_signed: Boolean(agreement.representative_signature),
      finalized_at: agreement.finalized_at,
    };
  }

  async getOrCreate(quoteId: number, userId: number) {
    const quote = await this.quote(quoteId);
    if (quote.status === TradeInQuoteStatus.CANCELLED) throw new BadRequestException('Cancelled requests cannot be finalized.');
    let agreement = await this.agreement(quoteId);
    if (!agreement) {
      const method = quote.pricing_path?.find((entry) => entry.label === 'fulfillment_method')?.answers?.[0]?.text === 'gstore'
        ? 'gstore_credit' : 'cash';
      const initial = {
        seller_name: quote.customer_name, personal_id: '', phone: quote.customer_phone,
        address: '', brand_model: quote.product_name, storage: '', color: '', imei: '',
        serial: '', included_items: '', defects: '', settlement_method: method,
        final_price: Number(quote.final_price),
      };
      const details = await this.normalizeDetails(quote, initial, userId);
      agreement = await this.agreements.save(this.agreements.create({ quote_id: quoteId, details }));
    }
    return this.view(agreement);
  }

  async saveDraft(quoteId: number, userId: number, raw: Record<string, unknown>) {
    const quote = await this.quote(quoteId);
    if (quote.status === TradeInQuoteStatus.CANCELLED) throw new BadRequestException('Cancelled requests cannot be finalized.');
    const details = await this.normalizeDetails(quote, raw, userId);
    return this.agreements.manager.transaction(async (manager) => {
      const agreement = await this.lockedAgreement(manager, quoteId);
      if (!agreement) throw new NotFoundException('Open the agreement first.');
      if (agreement.finalized_at) throw new BadRequestException('Finalized agreements cannot be changed.');
      if (agreement.representative_signature) {
        details.representative_name = (agreement.details as AgreementDetails).representative_name;
      }
      agreement.details = details;
      return this.view(await manager.save(agreement));
    });
  }

  async startSigning(quoteId: number) {
    const quote = await this.quote(quoteId);
    if (quote.status === TradeInQuoteStatus.CANCELLED) throw new BadRequestException('Cancelled requests cannot be signed.');
    return this.agreements.manager.transaction(async (manager) => {
      const agreement = await this.lockedAgreement(manager, quoteId);
      if (!agreement) throw new NotFoundException('Agreement not found.');
      if (agreement.finalized_at) throw new BadRequestException('Agreement is already finalized.');
      const token = randomBytes(32).toString('base64url');
      agreement.signing_token_hash = createHash('sha256').update(token).digest('hex');
      agreement.signing_token_expires_at = new Date(Date.now() + 15 * 60 * 1000);
      agreement.customer_signature = null;
      agreement.customer_signed_at = null;
      await manager.save(agreement);
      return { token, expires_at: agreement.signing_token_expires_at };
    });
  }

  private async validToken(token: string) {
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new GoneException('Signing link is invalid.');
    const hash = createHash('sha256').update(token).digest('hex');
    const agreement = await this.agreements.createQueryBuilder('agreement')
      .addSelect('agreement.signing_token_hash')
      .where('agreement.signing_token_hash = :hash', { hash }).getOne();
    if (!agreement || agreement.finalized_at || !agreement.signing_token_expires_at || agreement.signing_token_expires_at.getTime() < Date.now()) {
      throw new GoneException('Signing link has expired. Ask staff for a new QR code.');
    }
    const quote = await this.quote(agreement.quote_id);
    if (quote.status === TradeInQuoteStatus.CANCELLED) throw new GoneException('This request was cancelled.');
    return agreement;
  }

  async signingPreview(token: string) {
    const agreement = await this.validToken(token);
    const quote = await this.quote(agreement.quote_id);
    return { quote_number: quote.quote_number };
  }

  async submitCustomerSignature(token: string, dataUrl: string) {
    const bytes = signatureBuffer(dataUrl);
    const agreement = await this.validToken(token);
    const result = await this.agreements.createQueryBuilder().update(TradeInAgreement)
      .set({ customer_signature: bytes, customer_signed_at: new Date(), signing_token_hash: null, signing_token_expires_at: null })
      .where('id = :id AND signing_token_hash = :hash AND finalized_at IS NULL', {
        id: agreement.id, hash: agreement.signing_token_hash,
      }).execute();
    if (!result.affected) throw new GoneException('Signing link was already used.');
    return { signed: true };
  }

  private signatureTitle(value: string) {
    const title = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
    if (!title || title.length > 80) throw new BadRequestException('Enter a signature title of up to 80 characters.');
    return title;
  }

  async getStaffSignature(userId: number) {
    const rows = await this.signatureProfiles.createQueryBuilder('profile').addSelect('profile.signature')
      .where('profile.user_id = :userId', { userId }).orderBy('profile.id', 'ASC').getMany();
    const signatures = rows.map((row) => ({
      id: row.id, title: row.title, signature: `data:image/png;base64,${row.signature.toString('base64')}`,
      updated_at: row.updated_at,
    }));
    return { signatures, signature: signatures[0]?.signature || null };
  }

  async createStaffSignatureProfile(userId: number, rawTitle: string, dataUrl?: string) {
    const title = this.signatureTitle(rawTitle);
    if (!dataUrl) throw new BadRequestException('Draw a signature first.');
    const signature = signatureBuffer(dataUrl);
    await this.signatureProfiles.manager.transaction(async (manager) => {
      if (await manager.findOne(TradeInStaffSignatureProfile, { where: { user_id: userId, title } })) {
        throw new BadRequestException('A signature with this title already exists.');
      }
      await manager.save(TradeInStaffSignatureProfile, { user_id: userId, title, signature });
      await this.revokeStaffSigningLinks(manager, userId, 'saved');
    });
    return this.getStaffSignature(userId);
  }

  async updateStaffSignatureProfile(userId: number, id: number, rawTitle: string, dataUrl?: string) {
    const title = this.signatureTitle(rawTitle);
    const signature = dataUrl ? signatureBuffer(dataUrl) : null;
    await this.signatureProfiles.manager.transaction(async (manager) => {
      const profile = await manager.findOne(TradeInStaffSignatureProfile, {
        where: { id, user_id: userId }, lock: { mode: 'pessimistic_write' },
      });
      if (!profile) throw new NotFoundException('Signature not found.');
      const duplicate = await manager.findOne(TradeInStaffSignatureProfile, { where: { user_id: userId, title } });
      if (duplicate && duplicate.id !== id) throw new BadRequestException('A signature with this title already exists.');
      profile.title = title;
      if (signature) profile.signature = signature;
      await manager.save(profile);
      await this.revokeStaffSigningLinks(manager, userId, 'saved');
    });
    return this.getStaffSignature(userId);
  }

  async deleteStaffSignatureProfile(userId: number, id: number) {
    const deleted = await this.signatureProfiles.delete({ id, user_id: userId });
    if (!deleted.affected) throw new NotFoundException('Signature not found.');
  }

  // Retain the previous endpoint for staff who still have an old admin tab open.
  async saveStaffSignature(userId: number, dataUrl: string) {
    const signature = signatureBuffer(dataUrl);
    await this.staffSignatures.manager.transaction(async (manager) => {
      await manager.save(TradeInStaffSignature, { user_id: userId, signature });
      const existing = await manager.findOne(TradeInStaffSignatureProfile, { where: { user_id: userId }, order: { id: 'ASC' } });
      await manager.save(TradeInStaffSignatureProfile, {
        id: existing?.id, user_id: userId, title: existing?.title || 'ძირითადი ხელმოწერა', signature,
      });
      await this.revokeStaffSigningLinks(manager, userId, 'saved');
    });
    return this.getStaffSignature(userId);
  }

  private async revokeStaffSigningLinks(manager: EntityManager, userId: number, purpose: StaffSigningPurpose, quoteId?: number) {
    const links = manager.createQueryBuilder().delete().from(TradeInStaffSigningLink)
      .where('user_id = :userId AND purpose = :purpose', { userId, purpose });
    if (quoteId === undefined) links.andWhere('quote_id IS NULL');
    else links.andWhere('quote_id = :quoteId', { quoteId });
    await links.execute();
  }

  async startStaffSigning(userId: number, quoteId?: number, profileInput?: { title?: string; profile_id?: number }) {
    const purpose: StaffSigningPurpose = quoteId === undefined ? 'saved' : 'agreement';
    return this.agreements.manager.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { id: userId }, lock: { mode: 'pessimistic_write' } });
      if (!user || user.is_postponed) throw new BadRequestException('Employee account is unavailable.');
      if (purpose === 'agreement') {
        const quote = await manager.findOne(TradeInQuote, { where: { id: quoteId } });
        const agreement = await manager.findOne(TradeInAgreement, { where: { quote_id: quoteId } });
        if (!quote || !agreement) throw new NotFoundException('Open the agreement first.');
        if (quote.status === TradeInQuoteStatus.CANCELLED || agreement.finalized_at) {
          throw new BadRequestException('This agreement cannot be signed.');
        }
      }
      let profileId: number | null = null;
      let profileTitle: string | null = null;
      if (purpose === 'saved') {
        let profile = profileInput?.profile_id
          ? await manager.findOne(TradeInStaffSignatureProfile, { where: { id: profileInput.profile_id, user_id: userId } })
          : null;
        if (profileInput?.profile_id && !profile) throw new NotFoundException('Signature not found.');
        if (!profileInput?.title && !profile) {
          profile = await manager.findOne(TradeInStaffSignatureProfile, { where: { user_id: userId }, order: { id: 'ASC' } });
        }
        profileId = profile?.id || null;
        profileTitle = this.signatureTitle(profileInput?.title || profile?.title || 'ძირითადი ხელმოწერა');
        const duplicate = await manager.findOne(TradeInStaffSignatureProfile, { where: { user_id: userId, title: profileTitle } });
        if (duplicate && duplicate.id !== profileId) throw new BadRequestException('A signature with this title already exists.');
      }
      await this.revokeStaffSigningLinks(manager, userId, purpose, quoteId);
      const token = randomBytes(32).toString('base64url');
      const link = await manager.save(TradeInStaffSigningLink, {
        token_hash: createHash('sha256').update(token).digest('hex'),
        purpose,
        user_id: userId,
        quote_id: quoteId ?? null,
        signature_profile_id: profileId,
        signature_title: profileTitle,
        expires_at: new Date(Date.now() + 15 * 60 * 1000),
        used_at: null,
      });
      return { id: link.id, token, expires_at: link.expires_at };
    });
  }

  async staffSigningStatus(id: number, userId: number) {
    const link = await this.staffSigningLinks.findOne({ where: { id, user_id: userId } });
    if (!link) throw new NotFoundException('Signing link not found.');
    return { signed: Boolean(link.used_at), expired: !link.used_at && link.expires_at.getTime() < Date.now() };
  }

  private async validStaffSigningLink(token: string) {
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new GoneException('Signing link is invalid.');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const link = await this.staffSigningLinks.findOne({ where: { token_hash: tokenHash } });
    if (!link || link.used_at || link.expires_at.getTime() < Date.now()) {
      throw new GoneException('Signing link has expired or was already used. Ask for a new QR code.');
    }
    return link;
  }

  async staffSigningPreview(token: string) {
    const link = await this.validStaffSigningLink(token);
    const user = await this.users.findOne({ where: { id: link.user_id } });
    if (!user || user.is_postponed) throw new GoneException('Employee account is unavailable.');
    let quoteNumber: string | null = null;
    if (link.purpose === 'agreement') {
      if (!link.quote_id) throw new GoneException('Signing link is invalid.');
      const quote = await this.quote(link.quote_id);
      const agreement = await this.agreement(link.quote_id);
      if (quote.status === TradeInQuoteStatus.CANCELLED || agreement?.finalized_at || !agreement) {
        throw new GoneException('This agreement cannot be signed.');
      }
      quoteNumber = quote.quote_number;
    }
    return { purpose: link.purpose, signer_name: `${user.name} ${user.last_name}`.trim(), quote_number: quoteNumber, signature_title: link.signature_title };
  }

  async submitStaffSignature(token: string, dataUrl: string) {
    const bytes = signatureBuffer(dataUrl);
    const link = await this.validStaffSigningLink(token);
    return this.agreements.manager.transaction(async (manager) => {
      const locked = await manager.findOne(TradeInStaffSigningLink, {
        where: { id: link.id }, lock: { mode: 'pessimistic_write' },
      });
      if (!locked || locked.used_at || locked.expires_at.getTime() < Date.now()) {
        throw new GoneException('Signing link was already used or expired.');
      }
      const user = await manager.findOne(User, { where: { id: locked.user_id } });
      if (!user || user.is_postponed) throw new GoneException('Employee account is unavailable.');
      if (locked.purpose === 'saved') {
        const title = this.signatureTitle(locked.signature_title || 'ძირითადი ხელმოწერა');
        if (locked.signature_profile_id) {
          const profile = await manager.findOne(TradeInStaffSignatureProfile, {
            where: { id: locked.signature_profile_id, user_id: locked.user_id }, lock: { mode: 'pessimistic_write' },
          });
          if (!profile) throw new GoneException('Signature profile no longer exists.');
          profile.title = title;
          profile.signature = bytes;
          await manager.save(profile);
        } else {
          if (await manager.findOne(TradeInStaffSignatureProfile, { where: { user_id: locked.user_id, title } })) {
            throw new BadRequestException('A signature with this title already exists.');
          }
          await manager.save(TradeInStaffSignatureProfile, { user_id: locked.user_id, title, signature: bytes });
        }
      } else {
        if (locked.purpose !== 'agreement' || !locked.quote_id) throw new GoneException('Signing link is invalid.');
        const quote = await manager.findOne(TradeInQuote, { where: { id: locked.quote_id } });
        const agreement = await this.lockedAgreement(manager, locked.quote_id);
        if (!quote || !agreement || agreement.finalized_at || quote.status === TradeInQuoteStatus.CANCELLED) {
          throw new GoneException('This agreement cannot be signed.');
        }
        agreement.representative_signature = bytes;
        agreement.representative_user_id = locked.user_id;
        agreement.details = { ...agreement.details, representative_name: `${user.name} ${user.last_name}`.trim() };
        await manager.save(agreement);
      }
      locked.used_at = new Date();
      await manager.save(locked);
      return { signed: true };
    });
  }

  async setRepresentativeSignature(quoteId: number, userId: number, input: { use_saved?: boolean; signature_id?: number; signature?: string }) {
    if (!input.use_saved && !input.signature) throw new BadRequestException('Provide or select a signature.');
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Representative not found.');
    const representativeName = `${user.name} ${user.last_name}`.trim();
    let signature: Buffer;
    if (input.use_saved) {
      const selected = this.signatureProfiles.createQueryBuilder('profile').addSelect('profile.signature')
        .where('profile.user_id = :userId', { userId });
      if (input.signature_id) selected.andWhere('profile.id = :id', { id: input.signature_id });
      const row = await selected.orderBy('profile.id', 'ASC').getOne();
      if (!row) throw new BadRequestException('Save your signature in Shop Admin settings first.');
      signature = row.signature;
    } else {
      signature = signatureBuffer(input.signature);
    }
    return this.agreements.manager.transaction(async (manager) => {
      const agreement = await this.lockedAgreement(manager, quoteId);
      if (!agreement) throw new NotFoundException('Agreement not found.');
      if (agreement.finalized_at) throw new BadRequestException('Agreement is already finalized.');
      if ((agreement.details as AgreementDetails).representative_name !== representativeName) {
        agreement.details = { ...agreement.details, representative_name: representativeName };
      }
      agreement.representative_signature = signature;
      agreement.representative_user_id = userId;
      const saved = await manager.save(agreement);
      await this.revokeStaffSigningLinks(manager, userId, 'agreement', quoteId);
      return this.view(saved);
    });
  }

  async finalize(quoteId: number, userId: number) {
    const result = await this.agreements.manager.transaction(async (manager) => {
      const agreement = await this.lockedAgreement(manager, quoteId);
      if (!agreement) throw new NotFoundException('Agreement not found.');
      if (agreement.finalized_at) throw new BadRequestException('Agreement is already finalized.');
      const quote = await manager.findOne(TradeInQuote, { where: { id: quoteId }, lock: { mode: 'pessimistic_write' } });
      if (!quote || quote.status === TradeInQuoteStatus.CANCELLED) throw new BadRequestException('Request cannot be finalized.');
      const details = agreement.details as AgreementDetails;
      requireCompleteDetails(details);
      if (details.terms_hash !== currentTermsHash) throw new BadRequestException('Agreement terms changed. Re-sign the updated agreement.');
      if (!agreement.customer_signature || !agreement.representative_signature || !agreement.customer_signed_at) {
        throw new BadRequestException('Both signatures are required.');
      }
      const pdf = await makeAgreementPdf({
        number: `TI-${quote.quote_number}`, date: new Date(), details,
        customerSignature: agreement.customer_signature, representativeSignature: agreement.representative_signature,
      });
      agreement.pdf_data = pdf;
      agreement.finalized_at = new Date();
      agreement.finalized_by_user_id = userId;
      agreement.signing_token_hash = null;
      agreement.signing_token_expires_at = null;
      quote.customer_name = details.seller_name;
      quote.customer_phone = details.phone;
      quote.product_name = details.brand_model;
      quote.final_price = details.final_price.toFixed(2);
      quote.status = TradeInQuoteStatus.COMPLETED;
      const pricingPath = (quote.pricing_path || []).filter((entry) => entry.label !== 'fulfillment_method'
        && (details.settlement_method === 'gstore_credit' || entry.label !== 'gstore_product'));
      pricingPath.push({
        question: 'Fulfillment', label: 'fulfillment_method',
        answers: [{ text: details.settlement_method === 'gstore_credit' ? 'gstore' : details.settlement_method, value: details.credit_bonus, attributes: [] }],
      });
      quote.pricing_path = pricingPath;
      await manager.save(quote);
      await manager.save(agreement);
      if (details.settlement_method === 'gstore_credit') {
        await this.vouchers.issue(manager, quoteId, details.final_price + details.credit_bonus);
      }
      return this.view(agreement);
    });
    if (result.details.settlement_method === 'gstore_credit') {
      await this.vouchers.send(quoteId).catch(() => undefined);
    }
    return result;
  }

  async getPdf(quoteId: number) {
    const agreement = await this.agreement(quoteId);
    if (!agreement?.finalized_at || !agreement.pdf_data) throw new NotFoundException('Finalized agreement PDF not found.');
    const quote = await this.quote(quoteId);
    return { bytes: agreement.pdf_data, filename: `trade-in-${quote.quote_number}.pdf` };
  }

  async getPreviewPdf(quoteId: number) {
    const agreement = await this.agreement(quoteId);
    if (!agreement) throw new NotFoundException('Open the agreement first.');
    if (agreement.finalized_at) return this.getPdf(quoteId);
    const quote = await this.quote(quoteId);
    if (quote.status === TradeInQuoteStatus.CANCELLED) throw new BadRequestException('Cancelled requests cannot be previewed.');
    const bytes = await makeAgreementPdf({
      number: `TI-${quote.quote_number}`, date: new Date(), details: agreement.details as AgreementDetails,
      customerSignature: agreement.customer_signature, representativeSignature: agreement.representative_signature,
      preview: true,
    });
    return { bytes, filename: `trade-in-${quote.quote_number}-preview.pdf` };
  }
}
