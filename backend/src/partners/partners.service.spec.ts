import { AuditLog } from '../audit/entities/audit-log.entity';
import { ServiceCase } from '../cases/entities/service-case.entity';
import { Partner } from './entities/partner.entity';
import { PartnersService } from './partners.service';

describe('PartnersService archiveOrDelete', () => {
  const makeService = (linkedCases: number) => {
    const partner = { id: 7, name: 'Gstore', active: true, archived_at: null } as Partner;
    const partnerQuery = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(partner),
    };
    const partnerRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(partnerQuery),
      save: jest.fn(async (value) => value),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const casesRepository = { count: jest.fn().mockResolvedValue(linkedCases) };
    const auditRepository = { save: jest.fn(async (value) => value) };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === Partner) return partnerRepository;
        if (entity === ServiceCase) return casesRepository;
        if (entity === AuditLog) return auditRepository;
        throw new Error('Unexpected repository');
      }),
    };
    const repository = {
      manager: { transaction: jest.fn((callback) => callback(manager)) },
    };
    const service = new PartnersService(repository as any, casesRepository as any);

    return { service, partner, partnerRepository, auditRepository };
  };

  it('archives a partner with linked cases without deleting or unlinking them', async () => {
    const { service, partner, partnerRepository, auditRepository } = makeService(3);

    await expect(service.archiveOrDelete(7, 1)).resolves.toEqual({
      action: 'archived', partner_id: 7, linked_cases: 3,
    });
    expect(partner.archived_at).toBeInstanceOf(Date);
    expect(partnerRepository.save).toHaveBeenCalledWith(partner);
    expect(partnerRepository.delete).not.toHaveBeenCalled();
    expect(auditRepository.save).toHaveBeenCalledWith(expect.objectContaining({ action: 'partner.archived' }));
  });

  it('hard deletes only when no service cases are linked', async () => {
    const { service, partnerRepository, auditRepository } = makeService(0);

    await expect(service.archiveOrDelete(7, 1)).resolves.toEqual({
      action: 'deleted', partner_id: 7, linked_cases: 0,
    });
    expect(partnerRepository.delete).toHaveBeenCalledWith(7);
    expect(partnerRepository.save).not.toHaveBeenCalled();
    expect(auditRepository.save).toHaveBeenCalledWith(expect.objectContaining({ action: 'partner.deleted' }));
  });

  it('restores an archived partner without changing linked cases', async () => {
    const { service, partner, partnerRepository, auditRepository } = makeService(2);
    partner.archived_at = new Date();

    await expect(service.restore(7, 1)).resolves.toMatchObject({ id: 7, archived_at: null });
    expect(partnerRepository.save).toHaveBeenCalledWith(partner);
    expect(partnerRepository.delete).not.toHaveBeenCalled();
    expect(auditRepository.save).toHaveBeenCalledWith(expect.objectContaining({ action: 'partner.restored' }));
  });
});
