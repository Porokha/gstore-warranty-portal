import { IntegrationsService } from './integrations.service';

describe('MobileSentrix latest sync job', () => {
  it('fetches the most recent job without an invalid findOne call', async () => {
    const job = { id: 'latest-job' };
    const service = Object.create(IntegrationsService.prototype) as IntegrationsService;
    const repository = { find: jest.fn(async () => [job]) };
    (service as any).mobileSentrixSyncJobsRepository = repository;
    jest.spyOn(service as any, 'formatMobileSentrixSyncJob').mockReturnValue({ id: job.id });

    await expect(service.getLatestMobileSentrixSyncJob()).resolves.toEqual({
      success: true,
      job: { id: job.id },
    });
    expect(repository.find).toHaveBeenCalledWith({ order: { created_at: 'DESC' }, take: 1 });
  });
});
