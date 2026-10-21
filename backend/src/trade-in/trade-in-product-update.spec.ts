import { TradeInService } from './trade-in.service';

describe('TradeInService product updates', () => {
  const product = () => ({
    id: 7,
    name: 'Phone',
    brand: 'Apple',
    category: 'Phone',
    category2: 'iPhone',
    image_src: '/media/phone.png',
    enabled: true,
  });

  it('preserves product metadata when only visibility changes', async () => {
    const existing = product();
    const repository = {
      findOne: jest.fn().mockResolvedValue(existing),
      save: jest.fn(async (value) => value),
    };
    const service = new TradeInService({} as any, repository as any, {} as any, {} as any, {} as any);

    await service.updateProduct(7, { enabled: false });

    expect(existing).toMatchObject({
      enabled: false,
      brand: 'Apple',
      category: 'Phone',
      category2: 'iPhone',
      image_src: '/media/phone.png',
    });
  });

  it('still permits explicitly clearing an optional product field', async () => {
    const existing = product();
    const repository = {
      findOne: jest.fn().mockResolvedValue(existing),
      save: jest.fn(async (value) => value),
    };
    const service = new TradeInService({} as any, repository as any, {} as any, {} as any, {} as any);

    await service.updateProduct(7, { brand: null } as any);

    expect(existing.brand).toBeNull();
    expect(existing.category).toBe('Phone');
  });
});
