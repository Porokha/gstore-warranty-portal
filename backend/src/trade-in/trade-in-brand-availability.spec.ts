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

  it('treats imported MacBook categories as laptops for brand availability', async () => {
    findOne.mockResolvedValue({ value: JSON.stringify({ laptop: { apple: true } }) });
    await expect((service as any).isProductBrandComingSoon({
      brand: 'Apple', category: 'MacBook Pro', category2: 'MacBook Pro (2016 - 2020)', slug: 'macbook-pro-13-2016-2020/macbook-pro-13-2016',
    })).resolves.toBe(true);
    await expect((service as any).isProductBrandComingSoon({
      brand: 'Apple', category: 'Apple', category2: 'MacBook', slug: 'macbook-neo',
    })).resolves.toBe(true);
  });

  it('includes MacBook aliases in laptop catalogue queries', async () => {
    const query = {
      select: jest.fn().mockReturnThis(), addSelect: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(), groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(), addOrderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };
    const productRepository = { createQueryBuilder: jest.fn().mockReturnValue(query) };
    const subject = new TradeInService({} as any, productRepository as any, {} as any, {} as any, { findOne } as any);

    await subject.listBrands('laptop');

    expect(query.andWhere).toHaveBeenCalledWith(expect.stringContaining("LIKE 'macbook%'"), { category: 'laptop' });
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
