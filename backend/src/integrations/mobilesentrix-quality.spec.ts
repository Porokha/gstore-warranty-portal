import { IntegrationsService } from './integrations.service';

describe('MobileSentrix quality overrides', () => {
  it('preserves an admin-edited quality during a full catalog sync', async () => {
    const existing = {
      id: 33297,
      slug: 'part-33297',
      sort_order: 1,
      is_active: true,
      quality_line: 'Zezva Premium',
      supplier_payload: { product_badges_text: 'Premium' },
    };
    const repository = {
      findOne: jest.fn(async () => existing),
      save: jest.fn(async (product) => product),
    };
    const service = Object.create(IntegrationsService.prototype) as IntegrationsService;
    (service as any).shopProductsRepository = repository;

    await (service as any).upsertMobileSentrixProduct({
      supplier_product_id: '33297',
      title: 'Screen',
      quality_line: 'New Supplier Quality',
      calculated_price_gel: 100,
      supplier_price_usd: 20,
      supplier_currency: 'USD',
      supplier_exchange_rate: 2.7,
      raw: { product_badges_text: 'New Supplier Quality' },
    });

    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
      quality_line: 'Zezva Premium',
    }));
  });

  it('accepts supplier quality changes when an admin has not edited it', async () => {
    const repository = {
      findOne: jest.fn(async () => ({
        id: 33297,
        slug: 'part-33297',
        sort_order: 1,
        is_active: false,
        quality_line: 'Premium',
        supplier_payload: { product_badges_text: 'Premium' },
      })),
      save: jest.fn(async (product) => product),
    };
    const service = Object.create(IntegrationsService.prototype) as IntegrationsService;
    (service as any).shopProductsRepository = repository;

    await (service as any).upsertMobileSentrixProduct({
      supplier_product_id: '33297',
      title: 'Screen',
      quality_line: 'Original',
      calculated_price_gel: 100,
      supplier_price_usd: 20,
      supplier_currency: 'USD',
      supplier_exchange_rate: 2.7,
      raw: { product_badges_text: 'Original' },
    });

    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
      quality_line: 'Original',
    }));
  });
});
