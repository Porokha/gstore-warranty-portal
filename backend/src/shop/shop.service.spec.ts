import { ShopService } from './shop.service';
import { ShopOrderHeardAbout, ShopOrderItemMode, ShopOrderPaymentChoice } from './dto/create-public-shop-order.dto';

describe('ShopService admin product filters', () => {
  const createQuery = (state: { clauses: string[]; params: Record<string, unknown>; skip: number; take: number }) => {
    const query: any = {
      where: jest.fn((clause: string, params = {}) => {
        state.clauses.push(clause);
        Object.assign(state.params, params);
        return query;
      }),
      andWhere: jest.fn((clause: string, params = {}) => {
        state.clauses.push(clause);
        Object.assign(state.params, params);
        return query;
      }),
      clone: jest.fn(() => createQuery({ ...state, clauses: [...state.clauses], params: { ...state.params } })),
      orderBy: jest.fn(() => query),
      addOrderBy: jest.fn(() => query),
      skip: jest.fn((value: number) => { state.skip = value; return query; }),
      take: jest.fn((value: number) => { state.take = value; return query; }),
      select: jest.fn(() => query),
      addSelect: jest.fn(() => query),
      getManyAndCount: jest.fn(async () => [[], 14]),
      getRawOne: jest.fn(async () => ({ all: '500', available: '200', low: '20', none: '280', visible: '3', hidden: '497' })),
      getRawMany: jest.fn(async () => [{ value: 'smartphones' }]),
      state,
    };
    return query;
  };

  it('applies MobileSentrix search and filters before paginating, while returning full-catalog counts', async () => {
    const query = createQuery({ clauses: [], params: {}, skip: 0, take: 0 });
    const productsRepository = { createQueryBuilder: jest.fn(() => query) };
    const service = new ShopService(productsRepository as any, {} as any);
    jest.spyOn(service as any, 'purgeExpiredTrash').mockResolvedValue(undefined);

    const result = await service.listAdminProducts('active', 'mobilesentrix', 2, 100, {
      search: 'iPhone_15', stock: 'in_stock', visibility: 'hidden', sync: 'not_synced',
    });

    expect(query.state.clauses.join(' ')).toContain('product.supplier_sku LIKE :search');
    expect(query.state.clauses.join(' ')).toContain('product.stock_quantity > 0');
    expect(query.state.clauses.join(' ')).toContain('product.is_active = :hidden');
    expect(query.state.clauses.join(' ')).toContain('product.supplier_synced_at IS NULL');
    expect(query.state.params.search).toBe('%iPhone\\_15%');
    expect(query.state.skip).toBe(100);
    expect(query.state.take).toBe(100);
    expect(result.total).toBe(14);
    expect(result.facets.counts.hidden).toBe(497);
  });

  it('filters manual categories and returns all category options', async () => {
    const query = createQuery({ clauses: [], params: {}, skip: 0, take: 0 });
    const productsRepository = { createQueryBuilder: jest.fn(() => query) };
    const service = new ShopService(productsRepository as any, {} as any);
    jest.spyOn(service as any, 'purgeExpiredTrash').mockResolvedValue(undefined);

    const result = await service.listAdminProducts('active', 'manual', 1, 200, {
      device: 'smartphones', part: 'battery', stock: 'low',
    });

    expect(query.state.clauses.join(' ')).toContain('product.device_category = :device');
    expect(query.state.clauses.join(' ')).toContain('product.part_category = :part');
    expect(query.state.clauses.join(' ')).toContain('product.stock_quantity < 10');
    expect(result.facets.devices).toEqual(['smartphones']);
    expect(result.facets.parts).toEqual(['smartphones']);
  });

  it('does not re-download an unchanged supplier image when editing a product', async () => {
    const product = {
      id: 33297,
      image_url: 'https://supplier.example/product.jpg',
      price: null,
      sale_price: null,
      service_price: null,
      gallery_images: [],
      compatibility_tags: [],
      search_tags: [],
    };
    const productsRepository = {
      findOne: jest.fn(async () => product),
      save: jest.fn(async () => product),
    };
    const service = new ShopService(productsRepository as any, {} as any);
    const prepareImage = jest.spyOn(service as any, 'prepareImageUrl');

    await service.updateProduct(product.id, { image_url: product.image_url, is_active: true, quality_line: 'Zezva Premium' });

    expect(prepareImage).not.toHaveBeenCalled();
    expect(productsRepository.save).toHaveBeenCalledWith(expect.objectContaining({ is_active: true }));
    expect(productsRepository.save).toHaveBeenCalledWith(expect.objectContaining({ quality_line: 'Zezva Premium' }));
  });

  it('saves a service sale price only when it is below a regular service price', async () => {
    const product = { id: 1, title: 'Battery replacement', slug: 'battery', price: '80.00', sale_price: null, service_price: '120.00', service_sale_price: null };
    const productsRepository = { findOne: jest.fn(async () => product), save: jest.fn(async () => product) };
    const service = new ShopService(productsRepository as any, {} as any);

    await service.updateProduct(1, { service_sale_price: 105 });
    expect(productsRepository.save).toHaveBeenCalledWith(expect.objectContaining({ service_sale_price: '105.00' }));

    await expect(service.updateProduct(1, { service_sale_price: 125 })).rejects.toThrow('Service sale price must be lower');
    expect(productsRepository.save).toHaveBeenCalledTimes(1);
  });

  it('charges the service sale price rather than the regular service price at checkout', async () => {
    const product = { id: 1, title: 'Battery replacement', is_active: true, deleted_at: null, price: '80.00', sale_price: null, service_price: '120.00', service_sale_price: '105.00' };
    const productsRepository = { find: jest.fn(async () => [product]) };
    const ordersRepository = { create: jest.fn((payload) => payload), save: jest.fn(async (payload) => ({ ...payload, id: 1 })) };
    const service = new ShopService(productsRepository as any, ordersRepository as any);
    jest.spyOn(service as any, 'purgeExpiredTrash').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'generateOrderNumber').mockResolvedValue('TEST-1');

    await service.createPublicOrder({
      customer_name: 'Test', customer_last_name: 'Customer', customer_phone: '555123456',
      customer_email: 'test@example.com', heard_about: ShopOrderHeardAbout.GOOGLE,
      has_partner_warranty: false, payment_method: ShopOrderPaymentChoice.ONSITE,
      items: [{ product_id: 1, mode: ShopOrderItemMode.SERVICE, quantity: 1 }],
    });

    expect(ordersRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      total_amount: '105.00', subtotal_amount: '80.00', service_amount: '25.00',
      items_json: [expect.objectContaining({ unit_price: 105 })],
    }));
  });
});
