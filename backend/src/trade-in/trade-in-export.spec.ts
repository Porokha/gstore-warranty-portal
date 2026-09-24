import { TradeInService } from './trade-in.service';

describe('TradeInService pricing export', () => {
  const find = jest.fn();
  const service = new TradeInService({} as any, { find } as any, {} as any, {} as any, {} as any);
  const product = (id: number) => ({ id, slug: `phone/${id}`, name: `Phone ${id}`, pricing_tree: { tree_json: [{ name: 'Condition' }] } });

  beforeEach(() => find.mockReset());

  it('exports only requested products using an ID filter', async () => {
    find.mockResolvedValue([product(2), product(5)]);
    const result = await service.exportPricingRules([2, 5]);
    expect(find).toHaveBeenCalledWith(expect.objectContaining({ where: { id: expect.objectContaining({ value: [2, 5] }) } }));
    expect(result.products.map((item) => item.id)).toEqual([2, 5]);
  });

  it('rejects missing or unpriced selected products instead of silently dropping them', async () => {
    find.mockResolvedValue([product(2)]);
    await expect(service.exportPricingRules([2, 5])).rejects.toThrow(/no longer exist/);
    find.mockResolvedValue([{ ...product(2), pricing_tree: null }]);
    await expect(service.exportPricingRules([2])).rejects.toThrow(/no pricing rules/);
  });
});
