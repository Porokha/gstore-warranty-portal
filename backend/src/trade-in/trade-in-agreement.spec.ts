import { BadRequestException, GoneException } from '@nestjs/common';
import { createHash } from 'crypto';
import * as path from 'path';
import { TradeInAgreementService } from './trade-in-agreement.service';
import { agreementTerms, makeAgreementPdf } from './trade-in-agreement.pdf';

const fullDetails = {
  terms_hash: createHash('sha256').update(JSON.stringify(agreementTerms)).digest('hex'),
  seller_name: 'ტესტი მომხმარებელი', personal_id: '12345678901', phone: '555123456',
  address: 'თბილისი', brand_model: 'iPhone', storage: '128GB', color: 'Black', imei: '123456789012345',
  serial: '', included_items: 'Phone', defects: 'არ აქვს', settlement_method: 'cash' as const,
  final_price: 500, credit_bonus: 0, gstore_product: '', representative_name: 'Shop Admin',
};

describe('Trade-in agreement', () => {
  const agreement = { id: 2, quote_id: 5, details: { ...fullDetails }, finalized_at: null, customer_signature: Buffer.from('old'), customer_signed_at: new Date(), signing_token_hash: 'old' };
  const agreementQuery = { addSelect: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), setLock: jest.fn().mockReturnThis(), getOne: jest.fn() };
  const manager = { createQueryBuilder: jest.fn().mockReturnValue(agreementQuery), findOne: jest.fn(), save: jest.fn(async (value) => value) };
  const agreements = { createQueryBuilder: jest.fn().mockReturnValue(agreementQuery), manager: { transaction: (callback: any) => callback(manager) } };
  const quotes = { findOne: jest.fn().mockResolvedValue({ id: 5, status: 'accepted', quote_number: 'TI-5' }) };
  const staffLinks = { findOne: jest.fn() };
  const profiles = { createQueryBuilder: jest.fn(), manager: { transaction: (callback: any) => callback(manager) } };
  const service = new TradeInAgreementService(agreements as any, quotes as any, {} as any, profiles as any, staffLinks as any, {} as any, {} as any, {} as any);

  beforeEach(() => {
    jest.restoreAllMocks();
    agreementQuery.getOne.mockReset().mockResolvedValue({ ...agreement, details: { ...fullDetails } });
    manager.save.mockClear();
    quotes.findOne.mockClear();
    manager.findOne.mockReset().mockResolvedValue({ id: 5, status: 'accepted' });
    staffLinks.findOne.mockReset();
  });

  it('invalidates an old customer signature when generating a new QR link', async () => {
    const result = await service.startSigning(5);
    expect(result.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(result.expires_at.getTime()).toBeGreaterThan(Date.now());
    const saved = manager.save.mock.calls[0][0];
    expect(saved.customer_signature).toBeNull();
    expect(saved.customer_signed_at).toBeNull();
    expect(saved.signing_token_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(saved.signing_token_hash).not.toBe(result.token);
  });

  it('issues a signature-only link before agreement details are complete', async () => {
    agreementQuery.getOne.mockResolvedValue({ ...agreement, details: { ...fullDetails, personal_id: '' } });
    const link = await service.startSigning(5);
    expect(link.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(manager.save).toHaveBeenCalledTimes(1);
  });

  it('keeps signatures when saved details have the same values in a different JSON key order', async () => {
    const oldSignature = Buffer.from('signed');
    agreementQuery.getOne.mockResolvedValue({
      ...agreement, customer_signature: oldSignature,
      details: Object.fromEntries(Object.entries(fullDetails).reverse()),
    });
    jest.spyOn(service as any, 'normalizeDetails').mockResolvedValue({ ...fullDetails });
    await service.saveDraft(5, 1, {});
    expect(manager.save.mock.calls[0][0].customer_signature).toBe(oldSignature);
  });

  it('keeps captured signatures and an active link when draft details change', async () => {
    const customerSignature = Buffer.from('customer');
    const representativeSignature = Buffer.from('representative');
    agreementQuery.getOne.mockResolvedValue({
      ...agreement, customer_signature: customerSignature, representative_signature: representativeSignature,
      signing_token_hash: 'pending-token', details: { ...fullDetails, representative_name: 'Original signer' },
    });
    jest.spyOn(service as any, 'normalizeDetails').mockResolvedValue({ ...fullDetails, final_price: 650, representative_name: 'Different editor' });
    await service.saveDraft(5, 1, {});
    const saved = manager.save.mock.calls[0][0];
    expect(saved.customer_signature).toBe(customerSignature);
    expect(saved.representative_signature).toBe(representativeSignature);
    expect(saved.signing_token_hash).toBe('pending-token');
    expect(saved.details.final_price).toBe(650);
    expect(saved.details.representative_name).toBe('Original signer');
  });

  it('only exposes the quote number to the signature pad', async () => {
    jest.spyOn(service as any, 'validToken').mockResolvedValue({ quote_id: 5 });
    expect(await service.signingPreview('a'.repeat(43))).toEqual({ quote_number: 'TI-5' });
  });

  it('rejects reused or unknown signing tokens', async () => {
    agreementQuery.getOne.mockResolvedValue(null);
    await expect(service.signingPreview('a'.repeat(43))).rejects.toThrow(GoneException);
  });

  it('does not reveal staff signing status to a different employee', async () => {
    staffLinks.findOne.mockResolvedValue(null);
    await expect(service.staffSigningStatus(12, 99)).rejects.toThrow('Signing link not found.');
    expect(staffLinks.findOne).toHaveBeenCalledWith({ where: { id: 12, user_id: 99 } });
  });

  it('rejects an already used staff QR token', async () => {
    staffLinks.findOne.mockResolvedValue({ used_at: new Date(), expires_at: new Date(Date.now() + 60000) });
    await expect(service.staffSigningPreview('a'.repeat(43))).rejects.toThrow(GoneException);
  });

  it('stores a one-time settings QR drawing for the issuing employee', async () => {
    const image = `data:image/png;base64,${Buffer.concat([
      Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lxoAAAAASUVORK5CYII=', 'base64'),
      Buffer.alloc(100),
    ]).toString('base64')}`;
    const link = { id: 7, user_id: 42, purpose: 'saved', quote_id: null, signature_title: 'სამუშაო', signature_profile_id: null, used_at: null as Date | null, expires_at: new Date(Date.now() + 60000) };
    staffLinks.findOne.mockResolvedValue(link);
    manager.findOne.mockImplementation(async (entity: any) => entity.name === 'TradeInStaffSigningLink' ? link : entity.name === 'User' ? { id: 42, is_postponed: false } : null);
    expect(await service.submitStaffSignature('a'.repeat(43), image)).toEqual({ signed: true });
    expect(manager.save).toHaveBeenCalledWith(expect.anything(), { user_id: 42, title: 'სამუშაო', signature: expect.any(Buffer) });
    expect(link.used_at).toBeInstanceOf(Date);
  });

  it('uses the selected owned signature profile for an agreement', async () => {
    const selectedSignature = Buffer.from('selected');
    const profileQuery = {
      addSelect: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(), orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({ id: 17, user_id: 42, signature: selectedSignature }),
    };
    profiles.createQueryBuilder.mockReturnValue(profileQuery);
    const users = (service as any).users;
    users.findOne = jest.fn().mockResolvedValue({ id: 42, name: 'Test', last_name: 'Employee' });
    const revoke = jest.spyOn(service as any, 'revokeStaffSigningLinks').mockResolvedValue(undefined);
    const result = await service.setRepresentativeSignature(5, 42, { use_saved: true, signature_id: 17 });
    expect(profileQuery.andWhere).toHaveBeenCalledWith('profile.id = :id', { id: 17 });
    expect(manager.save.mock.calls[0][0].representative_signature).toBe(selectedSignature);
    expect(result.representative_signed).toBe(true);
    revoke.mockRestore();
  });

  it('attaches a mobile representative drawing to its draft agreement', async () => {
    const image = `data:image/png;base64,${Buffer.concat([
      Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lxoAAAAASUVORK5CYII=', 'base64'),
      Buffer.alloc(100),
    ]).toString('base64')}`;
    const link = { id: 8, user_id: 42, purpose: 'agreement', quote_id: 5, used_at: null as Date | null, expires_at: new Date(Date.now() + 60000) };
    const draft = { ...agreement, details: { ...fullDetails }, representative_signature: null, representative_user_id: null };
    staffLinks.findOne.mockResolvedValue(link);
    agreementQuery.getOne.mockResolvedValue(draft);
    manager.findOne.mockImplementation(async (entity: any) => entity.name === 'TradeInStaffSigningLink'
      ? link : entity.name === 'User' ? { id: 42, name: 'Test', last_name: 'Employee', is_postponed: false }
        : { id: 5, status: 'accepted' });
    await service.submitStaffSignature('b'.repeat(43), image);
    expect(draft.representative_user_id).toBe(42);
    expect(draft.representative_signature).toBeInstanceOf(Buffer);
    expect(draft.details.representative_name).toBe('Test Employee');
    expect(link.used_at).toBeInstanceOf(Date);
  });

  it('does not finalize without both signatures', async () => {
    await expect(service.finalize(5, 1)).rejects.toThrow(BadRequestException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('stores the signed PDF and completes the request at the agreed price', async () => {
    const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lxoAAAAASUVORK5CYII=', 'base64');
    const signedAgreement = {
      ...agreement, details: { ...fullDetails, final_price: 650 }, customer_signature: image,
      representative_signature: image, customer_signed_at: new Date(), finalized_at: null,
      pdf_data: null as Buffer | null,
    };
    const quote = { id: 5, quote_number: 'TI-5', status: 'accepted', final_price: '500.00', pricing_path: [] };
    agreementQuery.getOne.mockResolvedValue(signedAgreement);
    manager.findOne.mockResolvedValue(quote);
    await service.finalize(5, 1);
    expect(quote.status).toBe('completed');
    expect(quote.final_price).toBe('650.00');
    expect(signedAgreement.pdf_data!.subarray(0, 4).toString()).toBe('%PDF');
    expect(signedAgreement.finalized_at).toBeInstanceOf(Date);
    expect(manager.save).toHaveBeenCalledTimes(2);
  });

  it('renders a signed Georgian agreement as a PDF', async () => {
    const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lxoAAAAASUVORK5CYII=', 'base64');
    const pdf = await makeAgreementPdf({ number: 'TI-TEST', date: new Date(), details: fullDetails, customerSignature: image, representativeSignature: image });
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(pdf.length).toBeGreaterThan(5000);
  });

  it.each(['cash', 'gstore_credit'] as const)('keeps a typical %s agreement on one A4 page', async (settlement_method) => {
    const pdf = await makeAgreementPdf({
      number: 'TI-TEST', date: new Date(), preview: true,
      details: {
        ...fullDetails, settlement_method,
        gstore_product: settlement_method === 'gstore_credit' ? 'iPhone 18 Pro 256GB Physical SIM' : '',
        credit_bonus: settlement_method === 'gstore_credit' ? 150 : 0,
      },
    });
    expect(pdf.toString('latin1').match(/\/Type \/Page\b/g)).toHaveLength(1);
  });

  it('bundles fonts for Georgian, Latin, numbers, punctuation, and the lari sign', () => {
    const fontkit = require('fontkit');
    const fontDirectory = path.join(process.cwd(), 'assets/fonts');
    const agreementFont = fontkit.openSync(path.join(fontDirectory, 'DejaVuSans.ttf'));
    const lariFont = fontkit.openSync(path.join(fontDirectory, 'NotoSansGeorgian-Regular.ttf'));
    for (const character of 'GSTORE iPhone 0123456789 № — „“ თბილისი') {
      expect(agreementFont.hasGlyphForCodePoint(character.codePointAt(0))).toBe(true);
    }
    expect(lariFont.hasGlyphForCodePoint('₾'.codePointAt(0))).toBe(true);
  });

  it('previews an incomplete unsigned draft without finalizing it', async () => {
    agreementQuery.getOne.mockResolvedValue({
      ...agreement, finalized_at: null, customer_signature: null, representative_signature: null,
      details: { ...fullDetails, personal_id: '', address: '', final_price: 0 },
    });
    const preview = await service.getPreviewPdf(5);
    expect(preview.filename).toBe('trade-in-TI-5-preview.pdf');
    expect(preview.bytes.subarray(0, 4).toString()).toBe('%PDF');
    expect(manager.save).not.toHaveBeenCalled();
  });
});
