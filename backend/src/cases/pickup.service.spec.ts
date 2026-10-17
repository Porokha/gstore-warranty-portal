import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CasePickup } from './entities/case-pickup.entity';
import { CaseStatusLevel, ResultType, ServiceCase } from './entities/service-case.entity';
import { PickupService } from './pickup.service';

const setup = (resultType: ResultType = ResultType.COVERED, paymentStatus = 'paid') => {
  const case_ = {
    id: 8,
    status_level: CaseStatusLevel.COMPLETED,
    pickup_pin_required: true,
    result_type: resultType,
    payments: resultType === ResultType.PAYABLE
      ? [{ offer_type: ResultType.PAYABLE, payment_status: paymentStatus }]
      : [{ offer_type: ResultType.COVERED, payment_status: 'pending' }],
  };
  let pickup: Partial<CasePickup> | null = null;
  const manager = {
    findOne: jest.fn(async (entity) => entity === ServiceCase ? case_ : pickup),
    create: jest.fn((_entity, value) => value),
    save: jest.fn(async (value) => {
      pickup = { ...pickup, ...value };
      return pickup;
    }),
  };
  const repo = {
    manager: { transaction: jest.fn((fn) => fn(manager)) },
    findOne: jest.fn(async () => pickup),
    update: jest.fn(),
  };
  const audit = { log: jest.fn() };
  const service = new PickupService(repo as any, { manager } as any, { get: () => 'test-secret' } as any, audit as any);
  return { service, repo, manager, audit, case_, getPickup: () => pickup };
};

describe('PickupService', () => {
  it('issues a six-digit PIN but stores only its hash', async () => {
    const { service, getPickup } = setup();
    const result = await service.issue(8, 2);
    expect(result.code).toMatch(/^\d{6}$/);
    expect(getPickup()?.pin_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(getPickup()?.pin_hash).not.toBe(result.code);
  });

  it('requires a paid payable offer before collection', async () => {
    const { service } = setup(ResultType.PAYABLE, 'pending');
    await expect(service.issue(8, 2)).rejects.toThrow(BadRequestException);
    await expect(service.verify(8, '123456', 2)).rejects.toThrow(BadRequestException);
  });

  it('also blocks direct collection of an unpaid payable case', async () => {
    const { service, case_ } = setup(ResultType.PAYABLE, 'pending');
    case_.pickup_pin_required = false;
    await expect(service.collectWithoutPin(8, 2)).rejects.toThrow(BadRequestException);
  });

  it('locks after five wrong PINs and collects exactly once with the correct PIN', async () => {
    const { service, getPickup, audit, case_ } = setup();
    const { code } = await service.issue(8, 2);
    const wrong = code === '000000' ? '999999' : '000000';
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(service.verify(8, wrong, 3)).rejects.toThrow(ForbiddenException);
    }
    expect(getPickup()?.failed_attempts).toBe(5);
    expect(getPickup()?.locked_until).toBeTruthy();
    await expect(service.verify(8, code, 3)).rejects.toThrow(ForbiddenException);
    expect(getPickup()?.collected_at).toBeFalsy();

    (getPickup() as CasePickup).locked_until = new Date(Date.now() - 1000);
    const result = await service.verify(8, code, 3);
    expect(result.collected_by_user_id).toBe(3);
    expect(getPickup()?.pin_hash).toBeNull();
    expect(case_.payments[0].payment_status).toBe('pending');
    expect(audit.log).toHaveBeenCalledWith(3, 'CASE_DEVICE_COLLECTED', expect.objectContaining({ caseId: 8 }));
    await expect(service.verify(8, code, 3)).rejects.toThrow(ForbiddenException);
  });

  it('allows one collection without a PIN only when the option was left unchecked', async () => {
    const { service, case_, getPickup, audit } = setup();
    case_.pickup_pin_required = false;
    await expect(service.issue(8, 2)).rejects.toThrow(BadRequestException);
    await expect(service.verify(8, '123456', 2)).rejects.toThrow(BadRequestException);

    const result = await service.collectWithoutPin(8, 3);
    expect(result.collected_by_user_id).toBe(3);
    expect(getPickup()?.collected_at).toBeTruthy();
    expect(audit.log).toHaveBeenCalledWith(3, 'CASE_DEVICE_COLLECTED_WITHOUT_PIN', expect.objectContaining({ caseId: 8 }));
    await expect(service.collectWithoutPin(8, 4)).rejects.toThrow(BadRequestException);
  });

  it('rejects direct collection when a pickup PIN was selected', async () => {
    const { service } = setup();
    await expect(service.collectWithoutPin(8, 2)).rejects.toThrow(BadRequestException);
  });
});
