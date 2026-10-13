export const formatShopWarranty = (value, language) => {
  const warranty = String(value || '').trim();
  const georgian = language?.toLowerCase().startsWith('ka');
  if (!warranty) return georgian ? '1 წელი' : '1 year';
  if (!georgian) return warranty;

  const normalized = warranty.toLowerCase().replace(/\s+/g, ' ');
  if (normalized === 'lifetime' || normalized === 'lifetime warranty') return 'უვადო';
  if (normalized === 'no warranty') return 'გარანტიის გარეშე';

  const duration = normalized.match(/^(\d+)\s*[- ]?\s*(years?|months?|days?)(?:\s+warranty)?$/);
  if (!duration) return warranty;
  const unit = duration[2].startsWith('year') ? 'წელი' : duration[2].startsWith('month') ? 'თვე' : 'დღე';
  return `${duration[1]} ${unit}`;
};
