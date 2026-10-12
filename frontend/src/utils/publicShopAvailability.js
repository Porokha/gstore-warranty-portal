export const isPublicShopEnabled = (
  hostname = typeof window !== 'undefined' ? window.location.hostname : '',
) => ['staging.zezva.ge', 'zezva.ge', 'www.zezva.ge'].includes(hostname);
