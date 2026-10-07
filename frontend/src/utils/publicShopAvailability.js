export const isStagingShopEnabled = (
  hostname = typeof window !== 'undefined' ? window.location.hostname : '',
) => hostname === 'staging.zezva.ge';
