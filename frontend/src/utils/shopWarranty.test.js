import { formatShopWarranty } from './shopWarranty';

test('translates supplier warranty durations for Georgian display', () => {
  expect(formatShopWarranty('1 year warranty', 'ka')).toBe('1 წელი');
  expect(formatShopWarranty('12 months warranty', 'ka')).toBe('12 თვე');
  expect(formatShopWarranty('Lifetime Warranty', 'ka')).toBe('უვადო');
  expect(formatShopWarranty('1 year warranty', 'en')).toBe('1 year warranty');
  expect(formatShopWarranty(null, 'ka')).toBe('1 წელი');
});

test('leaves unknown warranty terms unchanged', () => {
  expect(formatShopWarranty('Custom coverage', 'ka')).toBe('Custom coverage');
});
