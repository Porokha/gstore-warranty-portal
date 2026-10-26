import { formatFinanceDate, isFinanceRangeValid } from './financeReport';

describe('finance report dates', () => {
  it('uses Tbilisi time regardless of browser timezone', () => {
    expect(formatFinanceDate('2026-10-24T20:30:00.000Z')).toBe('2026-10-25 00:30');
    expect(formatFinanceDate(null)).toBe('-');
  });

  it('rejects reversed date ranges', () => {
    expect(isFinanceRangeValid({ start_date: '2026-10-25', end_date: '2026-10-24' })).toBe(false);
    expect(isFinanceRangeValid({ start_date: '2026-10-24', end_date: '2026-10-25' })).toBe(true);
  });
});
