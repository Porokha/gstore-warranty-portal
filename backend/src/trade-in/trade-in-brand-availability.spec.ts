import { TradeInService } from './trade-in.service';

describe('TradeInService brand availability', () => {
  const findOne = jest.fn();
  const service = new TradeInService({} as any, {} as any, {} as any, {} as any, { findOne } as any);

  beforeEach(() => {
    findOne.mockReset();
    findOne.mockResolvedValue({ value: JSON.stringify({ phone: { google: true } }) });
  });

  it('blocks a phone whose imported category is stored in category2', async () => {
    await expect((service as any).isProductBrandComingSoon({
      brand: 'Google', category: null, category2: 'Phone', slug: 'google-phone/pixel-10',
    })).resolves.toBe(true);
  });

  it('keeps the same brand available in a different category', async () => {
    await expect((service as any).isProductBrandComingSoon({
      brand: 'Google', category: 'Tablet', category2: 'Pixel Tablet', slug: 'google-tablet/pixel-tablet',
    })).resolves.toBe(false);
  });

  it('updates one brand without replacing the other availability flags', async () => {
    const setting = { value: JSON.stringify({ phone: { apple: true }, tablet: { samsung: true } }) };
    const manager = {
      query: jest.fn(),
      findOne: jest.fn().mockResolvedValue(setting),
      save: jest.fn(),
    };
    const categoryRepository = { findOne: jest.fn().mockResolvedValue({ slug: 'phone' }) };
    const settingRepository = { manager: { transaction: (callback: any) => callback(manager) } };
    const subject = new TradeInService(categoryRepository as any, {} as any, {} as any, {} as any, settingRepository as any);

    await expect(subject.updateBrandAvailability({ category: 'phone', brand: 'Google', coming_soon: true }))
      .resolves.toEqual({ category: 'phone', brand: 'Google', coming_soon: true });
    expect(JSON.parse(setting.value)).toEqual({ phone: { apple: true, google: true }, tablet: { samsung: true } });
    expect(manager.save).toHaveBeenCalledWith(setting);
  });
});
