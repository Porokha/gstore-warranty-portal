import { CasePayment, PaymentStatus } from './entities/case-payment.entity';
import { financeCsvRow, formatFinanceDate } from './finance-export';

describe('finance CSV formatting', () => {
  it('formats both offer and paid timestamps in Tbilisi time', () => {
    expect(formatFinanceDate(new Date('2026-10-24T20:30:00Z'))).toBe('2026-10-25 00:30:00');
  });

  it('keeps historical paid time empty and escapes spreadsheet formulas', () => {
    const payment = {
      id: 1,
      offer_type: 'payable',
      offer_amount: 250,
      payment_status: PaymentStatus.PAID,
      created_at: new Date('2026-10-24T10:00:00Z'),
      updated_at: new Date('2026-10-24T11:00:00Z'),
      paid_at: null,
      case_: {
        customer_phone: '+995511533522',
        customer_initial_note: '=HYPERLINK("https://example.test")',
        status_history: [{ created_at: new Date('2026-10-24T10:30:00Z'), note_private: 'Reviewed' }],
      },
    } as unknown as CasePayment;
    const row = financeCsvRow(payment);
    expect(row).toContain('"2026-10-24 14:00:00","","2026-10-24 15:00:00"');
    expect(row).toContain('"\'+995511533522"');
    expect(row).toContain('"\'=HYPERLINK(""https://example.test"")"');
    expect(row).toContain('"Reviewed"');
  });
});
