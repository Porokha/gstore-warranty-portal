import { getMobileSentrixVisibility } from './mobilesentrix-visibility';

describe('MobileSentrix catalog visibility', () => {
  it('keeps new imports hidden until an admin enables them', () => {
    expect(getMobileSentrixVisibility()).toBe(false);
  });

  it('preserves manually chosen visibility during sync', () => {
    expect(getMobileSentrixVisibility({ is_active: false })).toBe(false);
    expect(getMobileSentrixVisibility({ is_active: true })).toBe(true);
  });
});
