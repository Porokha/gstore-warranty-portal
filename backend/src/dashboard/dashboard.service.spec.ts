import { DashboardService } from './dashboard.service';

describe('DashboardService date range', () => {
  it('applies both bounds when calculating paid totals', async () => {
    const query = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
      getMany: jest.fn().mockResolvedValue([]),
      getRawOne: jest.fn().mockResolvedValue({ count: '2', amount: '250.00' }),
    };
    const service = new DashboardService(
      { createQueryBuilder: () => query } as any,
      { count: jest.fn().mockResolvedValue(0) } as any,
      { createQueryBuilder: () => query } as any,
    );
    const start = new Date('2026-10-01T00:00:00Z');
    const end = new Date('2026-10-21T23:59:59Z');
    const result = await service.getDashboardStats({ start, end });
    expect(query.andWhere).toHaveBeenCalledWith('payment.created_at >= :paymentStart', { paymentStart: start });
    expect(query.andWhere).toHaveBeenCalledWith('payment.created_at <= :paymentEnd', { paymentEnd: end });
    expect(result.timeFiltered.totalPayments).toBe(2);
    expect(result.timeFiltered.totalMoneyIn).toBe(250);
  });
});
