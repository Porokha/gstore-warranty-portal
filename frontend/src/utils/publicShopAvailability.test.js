import { isStagingShopEnabled } from './publicShopAvailability';

describe('public shop availability', () => {
  it('opens only on the staging hostname', () => {
    expect(isStagingShopEnabled('staging.zezva.ge')).toBe(true);
    expect(isStagingShopEnabled('zezva.ge')).toBe(false);
    expect(isStagingShopEnabled('www.zezva.ge')).toBe(false);
    expect(isStagingShopEnabled('localhost')).toBe(false);
  });
});
