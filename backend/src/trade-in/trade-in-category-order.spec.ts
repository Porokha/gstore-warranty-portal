import { BadRequestException } from '@nestjs/common';
import { TradeInCategory } from './entities/trade-in-category.entity';
import { TradeInService } from './trade-in.service';

describe('TradeInService category order', () => {
  const categories = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const manager = {
    find: jest.fn().mockResolvedValue(categories),
    update: jest.fn().mockResolvedValue(undefined),
  };
  const categoryRepository = {
    manager: { transaction: (callback: any) => callback(manager) },
  };
  const service = new TradeInService(categoryRepository as any, {} as any, {} as any, {} as any, {} as any);

  beforeEach(() => {
    manager.find.mockClear();
    manager.update.mockClear();
  });

  it('saves the complete category order', async () => {
    await service.reorderCategories([3, 1, 2]);
    expect(manager.update.mock.calls).toEqual([
      [TradeInCategory, 3, { sort_order: 0 }],
      [TradeInCategory, 1, { sort_order: 1 }],
      [TradeInCategory, 2, { sort_order: 2 }],
    ]);
  });

  it('rejects incomplete or duplicate orders without updating', async () => {
    await expect(service.reorderCategories([1, 2])).rejects.toThrow(BadRequestException);
    await expect(service.reorderCategories([1, 1, 2])).rejects.toThrow(BadRequestException);
    expect(manager.update).not.toHaveBeenCalled();
  });
});
