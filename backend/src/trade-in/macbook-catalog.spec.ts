import { macBookDisplay, macBookFamily } from './macbook-catalog';

describe('MacBook catalogue labels', () => {
  it('groups the original slugs into customer-facing families', () => {
    expect(macBookFamily('macbook-air-2021-m/macbook-air-13-2022')).toBe('MacBook Air');
    expect(macBookFamily('macbook-pro-m1/macbook-pro-14-m3')).toBe('MacBook Pro');
    expect(macBookFamily('macbook-neo/macbook-neo-a18')).toBe('MacBook Neo');
    expect(macBookFamily('macbook-12/macbook-12')).toBe('MacBook');
  });

  it('removes the source backslash and identifies year and chip', () => {
    const tree = [{ questions: [{ answers: [{ attributes: [
      { key: 'processor_type', value: '[m2-8-core-cpu]' },
      { key: 'model_year', value: '[2022]' },
    ] }] }] }];
    expect(macBookDisplay({ name: 'MacBook Air 13\\', slug: 'macbook-air-2021-m/macbook-air-13-2022' }, tree))
      .toEqual({ name: 'MacBook Air 13" (2022, M2)', release_year: '2022', chip: 'M2' });
  });

  it('keeps a year range where the valuation asks for the exact year', () => {
    expect(macBookDisplay({ name: 'MacBook Air 11\\', slug: 'macbook-air-2012-2017/macbook-air-11' }))
      .toEqual({ name: 'MacBook Air 11" (2012-2017, Intel)', release_year: '2012-2017', chip: 'Intel' });
  });
});
