import { IntegrationsService } from './integrations.service';

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
