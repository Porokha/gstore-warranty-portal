import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CaseStatusLevel, CaseType, ResultType, ServiceCase } from './entities/service-case.entity';
import { CasePayment } from '../payments/entities/case-payment.entity';
import { CaseStatusHistory } from './entities/case-status-history.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { CasesService } from './cases.service';
import { Partner } from '../partners/entities/partner.entity';
import { CasesController } from './cases.controller';

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
      { resetForReopen: jest.fn() } as any,
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

describe('CasesService creation', () => {
  it('allocates case numbers from a locked database counter', async () => {
    const query = jest.fn().mockResolvedValueOnce([{ last_number: 509 }]).mockResolvedValueOnce([]);
    const service = new CasesService({} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any);
    expect(await service.generateCaseNumber({ query } as any)).toBe('SCN-000510');
    expect(query.mock.calls[0][0]).toContain('FOR UPDATE');
    expect(query.mock.calls[1]).toEqual(['UPDATE case_number_sequence SET last_number = ? WHERE id = 1', [510]]);
  });

  it('saves a new partner, case and initial note in one transaction', async () => {
    const saved: string[] = [];
    const manager = {
      getRepository: (entity: any) => entity === Partner
        ? { create: (value: any) => value, save: async (value: any) => { saved.push('partner'); return { ...value, id: 12 }; } }
        : entity === ServiceCase
          ? { save: async (value: any) => { saved.push('case'); return { ...value, id: 44 }; } }
          : { create: (value: any) => value, save: async () => { saved.push('history'); } },
    };
    const transaction = jest.fn((callback) => callback(manager));
    const service = new CasesService(
      { create: (value: any) => value, manager: { transaction } } as any,
      {} as any, {} as any,
      { findById: jest.fn().mockResolvedValue({ id: 1, role: 'admin' }) } as any,
      {} as any, {} as any, {} as any, {} as any,
    );
    jest.spyOn(service, 'generateCaseNumber').mockResolvedValue('SCN-000510');
    const result = await service.create({
      case_type: CaseType.PARTNER, new_partner: { name: 'Partner' },
      device_type: 'Laptop', sku: 'A', serial_number: 'B', product_title: 'Device', customer_initial_note: 'Check screen',
    } as any, 1);
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(saved).toEqual(['partner', 'case', 'history']);
    expect(result.partner_id).toBe(12);
  });
});

describe('Case list pagination and filters', () => {
  it('applies pagination before returning rows', async () => {
    const query = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[{ id: 4 }], 121]),
    };
    const service = new CasesService({ createQueryBuilder: () => query } as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any);
    await expect(service.findPage({}, 3, 25)).resolves.toEqual({ data: [{ id: 4 }], total: 121, page: 3, limit: 25 });
    expect(query.skip).toHaveBeenCalledWith(50);
    expect(query.take).toHaveBeenCalledWith(25);
  });

  it('keeps a comma-separated technician status filter intact', async () => {
    const service = { findAll: jest.fn().mockResolvedValue([]) };
    const controller = new CasesController(service as any, {} as any);
    await (controller.findAll as any)('1,2,3', undefined, undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
      { user: { role: 'technician' } });
    expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ status: [1, 2, 3] }));
  });
});

describe('CasesService assignment permissions', () => {
  it('rejects technician reassignment even when the API is called directly', async () => {
    const cases = { findOne: jest.fn().mockResolvedValue({ id: 5, assigned_technician_id: 1 }), save: jest.fn() };
    const service = new CasesService(
      cases as any, {} as any, {} as any,
      { findById: jest.fn().mockResolvedValue({ id: 1, role: 'technician' }) } as any,
      {} as any, {} as any, {} as any, {} as any,
    );
    await expect(service.update(5, { assigned_technician_id: 2 } as any, 1)).rejects.toThrow(ForbiddenException);
    expect(cases.save).not.toHaveBeenCalled();
  });

  it('rejects assignment to a non-technician and a partner case without a partner', async () => {
    const cases = { findOne: jest.fn().mockResolvedValue({ id: 5, case_type: CaseType.STANDARD, partner_id: null }), save: jest.fn() };
    const service = new CasesService(
      cases as any, {} as any, {} as any,
      { findById: jest.fn(async (id) => ({ id, role: 'manager' })) } as any,
      {} as any, {} as any, {} as any, {} as any,
    );
    await expect(service.update(5, { assigned_technician_id: 2 } as any, 1))
      .rejects.toThrow('active technician');
    await expect(service.update(5, { case_type: CaseType.PARTNER } as any, 1))
      .rejects.toThrow('requires a partner');
    expect(cases.save).not.toHaveBeenCalled();
  });
});

describe('CasesService status changes', () => {
  const setup = (case_: any, payments: any[] = [], role = 'manager') => {
    const caseSave = jest.fn(async (value) => value);
    const offerSave = jest.fn(async (value) => {
      if (!payments.includes(value)) payments.push(value);
      return value;
    });
    const query = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(async () => case_),
    };
    const cases = { createQueryBuilder: () => query, save: caseSave };
    const offers = { find: jest.fn(async () => payments), create: (value) => value, save: offerSave };
    const histories = { create: (value) => value, save: jest.fn(async (value) => value) };
    const manager = {
      getRepository: (entity) => entity === ServiceCase ? cases : entity === CasePayment ? offers : entity === CaseStatusHistory || entity === AuditLog ? histories : null,
    };
    const repository = { manager: { transaction: jest.fn((callback) => callback(manager)) } };
    const pickup = { issue: jest.fn().mockResolvedValue({ code: '012345' }), resetForReopen: jest.fn() };
    const sms = { sendSms: jest.fn() };
    const service = new CasesService(
      repository as any,
      {} as any,
      {} as any,
      { findById: jest.fn().mockResolvedValue({ id: 1, role }) } as any,
      sms as any,
      { log: jest.fn() } as any,
      { notifyManagersCasePending: jest.fn() } as any,
      pickup as any,
    );
    return { service, caseSave, offerSave, histories, pickup, sms, payments };
  };

  it('clears a saved outcome when a manager moves a case back before pending', async () => {
    const case_ = {
      id: 5,
      status_level: CaseStatusLevel.PENDING,
      result_type: ResultType.PAYABLE,
      customer_phone: null,
      payments: [],
    };
    const { service, caseSave } = setup(case_);

    await service.changeStatus(5, { new_status_level: CaseStatusLevel.INVESTIGATING } as any, 1);

    expect(case_.status_level).toBe(CaseStatusLevel.INVESTIGATING);
    expect(case_.result_type).toBeNull();
    expect(caseSave).toHaveBeenCalledWith(case_);
  });

  it('issues a pickup PIN after repair completion without marking a payment paid', async () => {
    const case_ = {
      id: 6,
      status_level: CaseStatusLevel.PENDING,
      pickup_pin_required: false,
      result_type: ResultType.COVERED,
      customer_phone: null,
      payments: [{ offer_type: ResultType.COVERED, payment_status: 'pending' }],
    };
    const { service, pickup } = setup(case_, case_.payments);

    const result = await service.changeStatus(6, { new_status_level: CaseStatusLevel.COMPLETED, require_pickup_pin: true, note_public: 'Repair completed' } as any, 1);

    expect((result as any).pickup_code).toBe('012345');
    expect(case_.pickup_pin_required).toBe(true);
    expect(pickup.issue).toHaveBeenCalledWith(6, 1);
    expect(case_.payments[0].payment_status).toBe('pending');
  });

  it('does not issue a PIN when the operator leaves the option unchecked', async () => {
    const case_ = {
      id: 7,
      status_level: CaseStatusLevel.PENDING,
      pickup_pin_required: false,
      result_type: ResultType.COVERED,
      customer_phone: null,
      payments: [],
    };
    const { service, pickup, offerSave } = setup(case_);

    const result = await service.changeStatus(7, { new_status_level: CaseStatusLevel.COMPLETED, note_public: 'Repair completed' } as any, 1);

    expect(result.pickup_pin_required).toBe(false);
    expect(pickup.issue).not.toHaveBeenCalled();
    expect(offerSave).toHaveBeenCalledTimes(1);
  });

  it('saves a payable stage and its offer together, then accepts a matching technician retry', async () => {
    const case_ = { id: 8, status_level: CaseStatusLevel.INVESTIGATING, result_type: null, customer_phone: null };
    const { service, offerSave, caseSave } = setup(case_, [], 'technician');
    const request = {
      new_status_level: CaseStatusLevel.PENDING,
      result_type: ResultType.PAYABLE,
      offer: { offer_type: ResultType.PAYABLE, offer_amount: 250, payment_method: 'onsite' },
    };
    await service.changeStatus(8, request as any, 1);
    expect(caseSave).toHaveBeenCalledTimes(1);
    expect(offerSave).toHaveBeenCalledTimes(1);
    expect(case_.status_level).toBe(CaseStatusLevel.PENDING);

    await service.changeStatus(8, request as any, 1);
    expect(caseSave).toHaveBeenCalledTimes(1);
    expect(offerSave).toHaveBeenCalledTimes(1);
  });

  it.each(['technician', 'tech-manager', 'super_technician', 'manager', 'admin'])(
    'lets %s move an opened case directly to pending', async (role) => {
      const case_ = { id: 18, status_level: CaseStatusLevel.OPENED, result_type: null, customer_phone: null };
      const { service } = setup(case_, [], role);
      await service.changeStatus(18, { new_status_level: CaseStatusLevel.PENDING, result_type: ResultType.COVERED } as any, 1);
      expect(case_.status_level).toBe(CaseStatusLevel.PENDING);
    },
  );

  it('prevents a technician from moving a case backwards while managers can', async () => {
    const technicianCase = { id: 19, status_level: CaseStatusLevel.PENDING, result_type: ResultType.COVERED };
    await expect(setup(technicianCase, [], 'technician').service.changeStatus(19, {
      new_status_level: CaseStatusLevel.INVESTIGATING,
    } as any, 1)).rejects.toThrow(ForbiddenException);

    const managerCase = { id: 20, status_level: CaseStatusLevel.PENDING, result_type: ResultType.COVERED };
    await setup(managerCase, [], 'manager').service.changeStatus(20, {
      new_status_level: CaseStatusLevel.INVESTIGATING,
    } as any, 1);
    expect(managerCase.result_type).toBeNull();
  });

  it('lets a technician repair a legacy pending case that is missing its payable offer', async () => {
    const case_ = { id: 12, status_level: CaseStatusLevel.PENDING, result_type: ResultType.PAYABLE, customer_phone: null };
    const { service, offerSave } = setup(case_, [], 'technician');
    await service.changeStatus(12, {
      new_status_level: CaseStatusLevel.PENDING,
      result_type: ResultType.PAYABLE,
      offer: { offer_type: ResultType.PAYABLE, offer_amount: 250, payment_method: 'onsite' },
    } as any, 1);
    expect(offerSave).toHaveBeenCalledTimes(1);
  });

  it('rejects incomplete completion before saving anything', async () => {
    const case_ = { id: 9, status_level: CaseStatusLevel.PENDING, result_type: null };
    const { service, caseSave, offerSave } = setup(case_);
    await expect(service.changeStatus(9, { new_status_level: CaseStatusLevel.COMPLETED } as any, 1))
      .rejects.toThrow(BadRequestException);
    expect(caseSave).not.toHaveBeenCalled();
    expect(offerSave).not.toHaveBeenCalled();
  });

  it('does not create a second replacement offer when completing a pending case', async () => {
    const case_ = { id: 10, status_level: CaseStatusLevel.PENDING, result_type: ResultType.REPLACEABLE, customer_phone: null };
    const { service, offerSave } = setup(case_, [{ offer_type: ResultType.REPLACEABLE, offer_amount: 50 }]);
    await service.changeStatus(10, { new_status_level: CaseStatusLevel.COMPLETED } as any, 1);
    expect(offerSave).not.toHaveBeenCalled();
  });

  it('does not resend a completion SMS when an already-completed case is saved again', async () => {
    const case_ = { id: 11, status_level: CaseStatusLevel.COMPLETED, result_type: ResultType.COVERED, customer_phone: '555123456' };
    const { service, sms } = setup(case_, [{ offer_type: ResultType.COVERED, offer_amount: 0 }]);
    await service.changeStatus(11, { new_status_level: CaseStatusLevel.COMPLETED, note_private: 'Follow-up' } as any, 1);
    expect(sms.sendSms).not.toHaveBeenCalled();
  });

  it('cancels a stale payable offer when the result changes', async () => {
    const case_ = { id: 21, status_level: CaseStatusLevel.PENDING, result_type: ResultType.PAYABLE, customer_phone: null };
    const oldOffer = { id: 4, offer_type: ResultType.PAYABLE, payment_status: 'pending', offer_amount: 250 };
    const { service, offerSave } = setup(case_, [oldOffer]);
    await service.changeStatus(21, { new_status_level: CaseStatusLevel.PENDING, result_type: ResultType.COVERED } as any, 1);
    expect(oldOffer.payment_status).toBe('cancelled');
    expect(offerSave).toHaveBeenCalledWith(oldOffer);
  });

  it('requires a public note when a covered case first becomes completed', async () => {
    const case_ = { id: 22, status_level: CaseStatusLevel.PENDING, result_type: ResultType.COVERED };
    const { service, caseSave } = setup(case_);
    await expect(service.changeStatus(22, { new_status_level: CaseStatusLevel.COMPLETED, note_public: '   ' } as any, 1))
      .rejects.toThrow('public note is required');
    expect(caseSave).not.toHaveBeenCalled();
  });

  it('resets pickup in the status transaction when reopening a completed case', async () => {
    const case_ = { id: 23, status_level: CaseStatusLevel.COMPLETED, result_type: ResultType.COVERED };
    const { service, pickup } = setup(case_);
    jest.spyOn(service, 'findOne').mockResolvedValue(case_ as any);
    await service.reopen(23, 1);
    expect(pickup.resetForReopen).toHaveBeenCalledWith(23, 1, expect.any(Object));
    expect(case_.status_level).toBe(CaseStatusLevel.PENDING);
  });
});
