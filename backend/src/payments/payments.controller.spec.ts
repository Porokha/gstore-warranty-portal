import { BadRequestException } from '@nestjs/common';
import { PaymentsController } from './payments.controller';

describe('PaymentsController finance filters', () => {
  const service = {
    findAll: jest.fn(),
    getFinanceSummary: jest.fn(),
    exportFinanceCsv: jest.fn(),
  };
  const controller = new PaymentsController(service as any, {} as any);

  beforeEach(() => jest.clearAllMocks());

  it('uses the same Tbilisi date range for the list and full export', async () => {
    service.findAll.mockResolvedValue({ data: [], total: 0 });
    service.exportFinanceCsv.mockResolvedValue('csv');
    const query = { start_date: '2026-10-24', end_date: '2026-10-25', date_basis: 'created', page: '2' };

    await controller.findAll(query);
    await controller.exportFinance(query);

    const listFilters = service.findAll.mock.calls[0][0];
    const exportFilters = service.exportFinanceCsv.mock.calls[0][0];
    expect(listFilters).toEqual(exportFilters);
    expect(listFilters.start_date.toISOString()).toBe('2026-10-23T20:00:00.000Z');
    expect(listFilters.end_date.toISOString()).toBe('2026-10-25T19:59:59.999Z');
    expect(service.findAll).toHaveBeenCalledWith(listFilters, 2, 50, false);
  });

  it('rejects reversed ranges and invalid date bases', () => {
    expect(() => controller.findAll({ start_date: '2026-10-25', end_date: '2026-10-24' }))
      .toThrow(BadRequestException);
    expect(() => controller.exportFinance({ date_basis: 'updated' }))
      .toThrow(BadRequestException);
  });
});
