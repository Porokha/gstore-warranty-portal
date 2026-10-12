import { isPublicShopEnabled } from './publicShopAvailability';

describe('public shop availability', () => {
  it('opens on Zezva staging and production hostnames', () => {
    expect(isPublicShopEnabled('staging.zezva.ge')).toBe(true);
    expect(isPublicShopEnabled('zezva.ge')).toBe(true);
    expect(isPublicShopEnabled('www.zezva.ge')).toBe(true);
    expect(isPublicShopEnabled('localhost')).toBe(false);
  });
});
