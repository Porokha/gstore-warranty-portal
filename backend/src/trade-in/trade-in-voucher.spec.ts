import { BadRequestException, ConflictException } from '@nestjs/common';
import { TradeInVoucherService } from './trade-in-voucher.service';

describe('Trade-in vouchers', () => {
  const voucher = {
    id: 1, quote_id: 12, code: '12345678', public_token: 'a'.repeat(43), amount: '350.00',
    expires_at: new Date(Date.now() + 86400000), redeemed_at: null, pos_order_id: null, sms_status: 'pending',
  };
  const vouchers = {
    findOne: jest.fn(), update: jest.fn(), createQueryBuilder: jest.fn(),
  };
  const service = new TradeInVoucherService(vouchers as any, {} as any, {} as any, { get: () => 'https://zezva.ge' } as any);

  beforeEach(() => jest.clearAllMocks());

  it('issues one 8-character mixed voucher with a 30-day expiry and opaque public token', async () => {
    const manager = { findOne: jest.fn().mockResolvedValue(null), save: jest.fn() };
    await service.issue(manager as any, 12, 350);
    expect(manager.save).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      quote_id: 12, code: expect.stringMatching(/^(?=.*[A-Z])(?=.*[2-9])[A-HJ-NP-Z2-9]{8}$/), public_token: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/), amount: '350.00',
    }));
    const expiry = manager.save.mock.calls[0][1].expires_at;
    expect(expiry.getTime() - Date.now()).toBeGreaterThan(29 * 86400000);
    expect(expiry.getTime() - Date.now()).toBeLessThan(31 * 86400000);
  });

  it('does not issue a duplicate for a finalized quote', async () => {
    const manager = { findOne: jest.fn().mockResolvedValue(voucher), save: jest.fn() };
    await service.issue(manager as any, 12, 350);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('does not expose customer information through the public token', async () => {
    vouchers.findOne.mockResolvedValue(voucher);
    expect(await service.publicView(voucher.public_token)).toEqual(expect.objectContaining({
      code: '12345678', amount: 350, status: 'active',
    }));
    expect(await service.publicView(voucher.public_token)).not.toHaveProperty('quote_id');
  });

  it('rejects redemption of a used or expired voucher', async () => {
    const execute = jest.fn().mockResolvedValue({ affected: 0 });
    const builder: any = { update: () => builder, set: () => builder, where: () => builder, execute };
    vouchers.createQueryBuilder.mockReturnValue(builder);
    await expect(service.redeem(12, 1)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns only the face value for an active voucher and refuses used codes', async () => {
    vouchers.findOne.mockResolvedValueOnce(voucher).mockResolvedValueOnce({ ...voucher, redeemed_at: new Date() });
    expect(await service.validateForPos(voucher.code)).toEqual(expect.objectContaining({ valid: true, amount_gel: 350, currency: 'GEL' }));
    expect(await service.validateForPos(voucher.code)).toEqual({ valid: false, reason: 'used' });
  });

  it('reports an expired voucher without exposing its amount', async () => {
    vouchers.findOne.mockResolvedValue({ ...voucher, expires_at: new Date(Date.now() - 1000) });
    expect(await service.validateForPos(voucher.code)).toEqual({ valid: false, reason: 'expired' });
  });

  it('atomically redeems the full amount against a successful POS order', async () => {
    vouchers.findOne.mockResolvedValue(voucher);
    const execute = jest.fn().mockResolvedValue({ affected: 1 });
    const builder: any = { update: () => builder, set: jest.fn(() => builder), where: () => builder, execute };
    vouchers.createQueryBuilder.mockReturnValue(builder);
    const result = await service.redeemForPos({
      code: voucher.code, order_id: '99612-1', order_total_gel: 500, applied_amount_gel: 350,
    });
    expect(result).toEqual(expect.objectContaining({ success: true, order_id: '99612-1', already_redeemed: false }));
    expect(builder.set).toHaveBeenCalledWith(expect.objectContaining({ pos_order_id: '99612-1', pos_applied_amount: '350.00' }));
  });

  it('accepts a retry from the same order but rejects a different order', async () => {
    vouchers.findOne.mockResolvedValue({ ...voucher, redeemed_at: new Date(), pos_order_id: '99612-1' });
    const payload = { code: voucher.code, order_id: '99612-1', order_total_gel: 500, applied_amount_gel: 350 };
    expect(await service.redeemForPos(payload)).toEqual(expect.objectContaining({ already_redeemed: true }));
    await expect(service.redeemForPos({ ...payload, order_id: '99612-2' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('resolves a concurrent retry using the stored POS order ID', async () => {
    vouchers.findOne.mockResolvedValueOnce(voucher).mockResolvedValueOnce({
      ...voucher, redeemed_at: new Date(), pos_order_id: 'checkout-123',
    });
    const execute = jest.fn().mockResolvedValue({ affected: 0 });
    const builder: any = { update: () => builder, set: () => builder, where: () => builder, execute };
    vouchers.createQueryBuilder.mockReturnValue(builder);
    const result = await service.redeemForPos({
      code: voucher.code, order_id: 'checkout-123', order_total_gel: 500, applied_amount_gel: 350,
    });
    expect(result.already_redeemed).toBe(true);
  });

  it('does not consume credit when the applied amount or order total is wrong', async () => {
    vouchers.findOne.mockResolvedValue(voucher);
    const payload = { code: voucher.code, order_id: '99612-1', order_total_gel: 500, applied_amount_gel: 350 };
    await expect(service.redeemForPos({ ...payload, applied_amount_gel: 200 })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.redeemForPos({ ...payload, order_total_gel: 300 })).rejects.toBeInstanceOf(BadRequestException);
    expect(vouchers.createQueryBuilder).not.toHaveBeenCalled();
  });
});
