import { IntegrationsService } from './integrations.service';
import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';

describe('POS voucher authorization', () => {
  const secret = 'f'.repeat(64);
  const service = Object.create(IntegrationsService.prototype) as IntegrationsService;
  (service as any).settingsService = { get: jest.fn().mockResolvedValue(secret) };
  (service as any).configService = { get: jest.fn() };

  it('accepts only the configured voucher bearer secret', async () => {
    await expect(service.assertPosVoucherAuthorization(`Bearer ${secret}`)).resolves.toBeUndefined();
    await expect(service.assertPosVoucherAuthorization(`Bearer ${'a'.repeat(64)}`)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(service.assertPosVoucherAuthorization()).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('fails closed when the secret is missing or too short', async () => {
    (service as any).settingsService.get.mockResolvedValueOnce('short');
    await expect(service.assertPosVoucherAuthorization('Bearer short')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});

describe('MobileSentrix automatic refresh', () => {
  it('skips a product protected by a manual edit before fetching rates or updating the database', async () => {
    const service = Object.create(IntegrationsService.prototype) as IntegrationsService;
    const result = await (service as any).updateExistingMobileSentrixProductFromCatalog(
      { id: 2, title: 'Edited product', supplier_auto_sync_disabled: true },
      {},
      new Map(),
      true,
    );

    expect(result).toEqual({ id: 2, title: 'Edited product', action: 'skipped' });
  });
});
