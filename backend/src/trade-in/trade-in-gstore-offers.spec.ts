import { TradeInService } from './trade-in.service';

describe('TradeInService Gstore offers', () => {
  const product = { id: 1, slug: 'apple-phone/iphone-13', name: 'iPhone 13', enabled: true };
  const card = { id: 'card-1', name: 'iPhone 15', subtitle: '128GB', image_url: '/uploads/shop/products/iphone.jpg', price_gel: 1590, bonus_percent: 20, bonus_fixed: null, enabled: true };
  const productRepository = { findOne: jest.fn() };
  const quoteRepository = { create: jest.fn((value) => value), save: jest.fn((value) => Promise.resolve({ ...value, id: 1 })) };
  const settingRepository = { findOne: jest.fn() };
  const service = new TradeInService({} as any, productRepository as any, {} as any, quoteRepository as any, settingRepository as any);

  beforeEach(() => {
    jest.clearAllMocks();
    productRepository.findOne.mockResolvedValue(product);
    settingRepository.findOne.mockImplementation(({ where }) => Promise.resolve({ value: where.key === 'gstore_offer_products'
      ? JSON.stringify([card])
      : JSON.stringify({ bonus_percent: 10, bonus_fixed: 5 }) }));
    (service as any).isProductBrandComingSoon = jest.fn().mockResolvedValue(false);
    (service as any).nextQuoteNumber = jest.fn().mockResolvedValue('TI-TEST');
  });

  it('uses the selected product bonus and records the product snapshot', async () => {
    const result = await service.createQuote({ product_slug: product.slug, final_price: 1000, customer_name: 'Test', customer_phone: '555123456',
      gstore_product_id: card.id,
      pricing_path: [{ label: 'fulfillment_method', answers: [{ text: 'gstore', value: 9999 }] }, { label: 'gstore_product', answers: [{ text: 'fake' }] }],
    });
    const saved = quoteRepository.create.mock.calls[0][0];
    expect(saved.pricing_path.find((step) => step.label === 'fulfillment_method').answers[0].value).toBe(205);
    expect(saved.pricing_path.filter((step) => step.label === 'gstore_product')).toHaveLength(1);
    expect(saved.pricing_path.find((step) => step.label === 'gstore_product').answers[0].text).toBe('iPhone 15');
    expect(result).toMatchObject({ offer_credit: 1205, remaining_price: 385, gstore_product: { id: card.id } });
  });

  it('rejects disabled product cards', async () => {
    settingRepository.findOne.mockImplementation(({ where }) => Promise.resolve({ value: where.key === 'gstore_offer_products'
      ? JSON.stringify([{ ...card, enabled: false }])
      : '{}' }));
    await expect(service.createQuote({ product_slug: product.slug, final_price: 1000, customer_name: 'Test', customer_phone: '555123456',
      gstore_product_id: card.id, pricing_path: [{ label: 'fulfillment_method', answers: [{ text: 'gstore' }] }],
    })).rejects.toThrow('Selected Gstore product is unavailable.');
    expect(quoteRepository.save).not.toHaveBeenCalled();
  });
});
