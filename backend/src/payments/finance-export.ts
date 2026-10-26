import { CasePayment } from './entities/case-payment.entity';

const tbilisiFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Tbilisi',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

export const formatFinanceDate = (value?: Date | string | null): string => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = Object.fromEntries(tbilisiFormatter.formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
};

const csvCell = (value: unknown): string => {
  let text = value == null ? '' : String(value);
  if (/^\s*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export const financeCsvHeader = [
  'Offer ID', 'Offer Created (Asia/Tbilisi)', 'Paid At (Asia/Tbilisi)',
  'Last Updated (Asia/Tbilisi)', 'Case Number', 'Customer Name',
  'Customer Phone', 'Assigned Technician', 'Result', 'Amount (GEL)',
  'Payment Method', 'Payment Status', 'Device Type', 'Product Title',
  'Serial Number', 'IMEI', 'Customer Initial Note', 'Public Notes', 'Internal Notes',
].map(csvCell).join(',');

export const financeCsvRow = (payment: CasePayment): string => {
  const case_ = payment.case_;
  const history = [...(case_?.status_history || [])].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const notes = (field: 'note_public' | 'note_private') => history
    .map((entry) => entry[field]?.trim())
    .filter(Boolean)
    .join(' | ');

  return [
    payment.id,
    formatFinanceDate(payment.created_at),
    formatFinanceDate(payment.paid_at),
    formatFinanceDate(payment.updated_at),
    case_?.case_number,
    [case_?.customer_name, case_?.customer_last_name].filter(Boolean).join(' '),
    case_?.customer_phone,
    [case_?.assigned_technician?.name, case_?.assigned_technician?.last_name].filter(Boolean).join(' '),
    payment.offer_type,
    payment.offer_amount == null ? '' : Number(payment.offer_amount).toFixed(2),
    payment.payment_method,
    payment.payment_status,
    case_?.device_type,
    case_?.product_title,
    case_?.serial_number,
    case_?.imei,
    case_?.customer_initial_note,
    notes('note_public'),
    notes('note_private'),
  ].map(csvCell).join(',');
};
