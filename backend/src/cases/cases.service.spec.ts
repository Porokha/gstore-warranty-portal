import { BadRequestException } from '@nestjs/common';
import { CaseStatusLevel, CaseType, ResultType } from './entities/service-case.entity';
import { CasesService } from './cases.service';

describe('CasesService partner cases', () => {
  it('does not create a new case for an archived partner', async () => {
    const partnerQuery = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({ id: 7, archived_at: new Date() }),
    };
    const save = jest.fn();
    const casesRepository = {
      create: jest.fn((value) => value),
      save,
      manager: {
        transaction: jest.fn((callback) => callback({
          getRepository: jest.fn((entity) => entity.name === 'Partner'
            ? { createQueryBuilder: () => partnerQuery }
            : { save }),
        })),
      },
    };
    const service = new CasesService(
      casesRepository as any,
      {} as any,
      {} as any,
      { findById: jest.fn().mockResolvedValue({ id: 1, role: 'admin' }) } as any,
      {} as any,
      {} as any,
      {} as any,
    );
    jest.spyOn(service, 'generateCaseNumber').mockResolvedValue('SCN-000001');

    await expect(service.create({
      case_type: CaseType.PARTNER,
      partner_id: 7,
      device_type: 'laptop',
    } as any, 1)).rejects.toThrow(BadRequestException);
    expect(partnerQuery.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(save).not.toHaveBeenCalled();
  });
});

describe('CasesService status changes', () => {
  it('clears a saved outcome when a manager moves a case back before pending', async () => {
    const case_ = {
      id: 5,
      status_level: CaseStatusLevel.PENDING,
      result_type: ResultType.PAYABLE,
      customer_phone: null,
      payments: [],
    };
    const casesRepository = { save: jest.fn(async (value) => value) };
    const service = new CasesService(
      casesRepository as any,
      {} as any,
      {} as any,
      { findById: jest.fn().mockResolvedValue({ id: 1, role: 'manager' }) } as any,
      {} as any,
      { log: jest.fn() } as any,
      {} as any,
    );
    jest.spyOn(service, 'findOne').mockResolvedValue(case_ as any);
    jest.spyOn(service as any, 'createHistoryEntry').mockResolvedValue(undefined);

    await service.changeStatus(5, { new_status_level: CaseStatusLevel.INVESTIGATING } as any, 1);

    expect(case_.status_level).toBe(CaseStatusLevel.INVESTIGATING);
    expect(case_.result_type).toBeNull();
    expect(casesRepository.save).toHaveBeenCalledWith(case_);
  });
});
