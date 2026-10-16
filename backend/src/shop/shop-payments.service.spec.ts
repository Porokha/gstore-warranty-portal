import { ShopPaymentsService } from './shop-payments.service';

describe('ShopPaymentsService', () => {
  const values: Record<string, string> = {};
  const settings = {
    get: jest.fn(async (key: string) => values[key] || null),
    set: jest.fn(async (key: string, value: string) => { values[key] = value; }),
  };
  const service = new ShopPaymentsService({} as any, {} as any, {} as any, settings as any);

  beforeEach(() => {
    Object.keys(values).forEach((key) => delete values[key]);
  });

  it('keeps online checkout disabled until credentials and switch are set', async () => {
    expect(await service.methods()).toEqual({ onsite: true, online: false });
    await expect(service.updateSettings({ onsite: false, online: false })).rejects.toThrow();
    await expect(service.updateSettings({ onsite: true, online: true })).rejects.toThrow();
    const result = await service.updateSettings({ onsite: true, online: true, client_id: 'id', client_secret: 'secret' });
    expect(result).toEqual({ onsite: true, online: true, client_id: 'id', secret_configured: true });
    expect(JSON.stringify(result)).not.toContain('secret"');
  });

  it('rejects unsigned callbacks before parsing them', async () => {
    await expect(service.callback(Buffer.from('{"event":"order_payment"}'), undefined)).rejects.toThrow();
    await expect(service.callback(Buffer.from('{"event":"order_payment"}'), 'invalid')).rejects.toThrow();
  });
});
