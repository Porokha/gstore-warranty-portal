import { BadRequestException } from '@nestjs/common';
import { TradeInVoucherService } from './trade-in-voucher.service';

describe('Trade-in vouchers', () => {
  const voucher = {
    id: 1, quote_id: 12, code: '12345678', public_token: 'a'.repeat(43), amount: '350.00',
    expires_at: new Date(Date.now() + 86400000), redeemed_at: null, sms_status: 'pending',
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
});
