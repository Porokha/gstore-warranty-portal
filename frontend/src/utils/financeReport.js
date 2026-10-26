const tbilisiFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Tbilisi',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export const formatFinanceDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const parts = Object.fromEntries(tbilisiFormatter.formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
};

export const isFinanceRangeValid = ({ start_date: start, end_date: end }) => !start || !end || start <= end;
