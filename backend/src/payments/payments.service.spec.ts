import { BadRequestException } from '@nestjs/common';
import { PaymentStatus } from './entities/case-payment.entity';
import { CaseStatusLevel, ResultType, ServiceCase } from '../cases/entities/service-case.entity';
import { PaymentsService } from './payments.service';

describe('PaymentsService.update', () => {
  it('edits an unpaid amount without accepting a payment-state change', async () => {
    const payment = { id: 3, payment_status: PaymentStatus.PENDING, offer_amount: 290 };
    const repository = {
      findOne: jest.fn().mockResolvedValue(payment),
      save: jest.fn(async (value) => value),
    };
    const service = new PaymentsService(repository as any, {} as any, {} as any);

    await service.update(3, { offer_amount: 250, payment_status: PaymentStatus.PAID } as any);

    expect(payment.offer_amount).toBe(250);
    expect(payment.payment_status).toBe(PaymentStatus.PENDING);
  });

  it('refuses to edit an already-paid offer', async () => {
    const repository = { findOne: jest.fn().mockResolvedValue({ id: 3, payment_status: PaymentStatus.PAID }) };
    const service = new PaymentsService(repository as any, {} as any, {} as any);

    await expect(service.update(3, { offer_amount: 250 })).rejects.toThrow(BadRequestException);
  });

  it('rejects paid and failed actions for a covered result', async () => {
    const repository = { findOne: jest.fn().mockResolvedValue({ id: 4, offer_type: ResultType.COVERED, payment_status: PaymentStatus.PENDING }) };
    const service = new PaymentsService(repository as any, {} as any, {} as any);

    await expect(service.markAsPaid(4)).rejects.toThrow(BadRequestException);
    await expect(service.markAsFailed(4)).rejects.toThrow(BadRequestException);
  });
});

describe('PaymentsService payment state', () => {
  it('records an exact paid timestamp when a payable offer is marked paid', async () => {
    const payment = {
      id: 6, case_id: 2, offer_type: ResultType.PAYABLE, payment_status: PaymentStatus.PENDING,
      case_: { id: 2, status_level: CaseStatusLevel.PENDING, result_type: ResultType.PAYABLE },
    };
    const repository = {
      findOne: jest.fn().mockResolvedValue(payment),
      manager: { transaction: jest.fn((callback) => callback({
        findOne: jest.fn((entity) => entity === ServiceCase ? payment.case_ : payment),
        save: jest.fn(async (value) => value),
      })) },
    };
    const service = new PaymentsService(repository as any, {} as any, { sendSms: jest.fn() } as any);

    await service.markAsPaid(6);

    expect(payment.payment_status).toBe(PaymentStatus.PAID);
    expect(payment).toHaveProperty('paid_at', expect.any(Date));
  });

  it('rejects reminders for a stale payable offer after the result changed', async () => {
    const payment = {
      id: 8, offer_type: ResultType.PAYABLE, payment_status: PaymentStatus.PENDING,
      case_: { result_type: ResultType.COVERED, status_level: CaseStatusLevel.PENDING },
    };
    const sms = { sendSms: jest.fn() };
    const service = new PaymentsService({ findOne: jest.fn().mockResolvedValue(payment) } as any, {} as any, sms as any);
    await expect(service.sendPaymentReminder(8)).rejects.toThrow('current pending payable');
    expect(sms.sendSms).not.toHaveBeenCalled();
  });
  it('cannot mark a failed payment paid, and allows an explicit retry', async () => {
    const payment = {
      id: 7, case_id: 2, offer_type: ResultType.PAYABLE, payment_status: PaymentStatus.FAILED,
      case_: { id: 2, status_level: CaseStatusLevel.PENDING, result_type: ResultType.PAYABLE },
    };
    const repository = {
      findOne: jest.fn().mockResolvedValue(payment),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      manager: {
        transaction: jest.fn((callback) => callback({
          findOne: jest.fn((entity) => entity === ServiceCase ? payment.case_ : payment),
          save: jest.fn(),
        })),
      },
    };
    const service = new PaymentsService(repository as any, {} as any, {} as any);
    await expect(service.markAsPaid(7)).rejects.toThrow('Only pending payments');
    await expect(service.retryFailed(7)).resolves.toBe(payment);
    expect(repository.update).toHaveBeenCalledWith(
      { id: 7, payment_status: PaymentStatus.FAILED },
      { payment_status: PaymentStatus.PENDING },
    );
  });

  it('rejects an old offer after the case result changes', async () => {
    const payment = { id: 7, case_id: 2, offer_type: ResultType.PAYABLE, payment_status: PaymentStatus.PENDING };
    const repository = {
      findOne: jest.fn().mockResolvedValue(payment),
      manager: { transaction: jest.fn((callback) => callback({
        findOne: jest.fn((entity) => entity === ServiceCase
          ? { id: 2, status_level: CaseStatusLevel.PENDING, result_type: ResultType.COVERED }
          : payment),
      })) },
    };
    const service = new PaymentsService(repository as any, {} as any, {} as any);
    await expect(service.markAsPaid(7)).rejects.toThrow('current payable case offer');
  });

  it('does not allow a paid offer to become failed', async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({ id: 7, offer_type: ResultType.PAYABLE, payment_status: PaymentStatus.PAID }),
      update: jest.fn(),
    };
    const service = new PaymentsService(repository as any, {} as any, {} as any);
    await expect(service.markAsFailed(7)).rejects.toThrow(BadRequestException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('marks a pending offer failed only if it is still pending in the database', async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({ id: 7, offer_type: ResultType.PAYABLE, payment_status: PaymentStatus.PENDING }),
      update: jest.fn().mockResolvedValue({ affected: 0 }),
    };
    const service = new PaymentsService(repository as any, {} as any, {} as any);
    await expect(service.markAsFailed(7)).rejects.toThrow('no longer pending');
    expect(repository.update).toHaveBeenCalledWith(
      { id: 7, payment_status: PaymentStatus.PENDING },
      { payment_status: PaymentStatus.FAILED },
    );
  });

  it('rejects an offer that disagrees with the case result', async () => {
    const caseRepository = { findOne: jest.fn().mockResolvedValue({ id: 2, status_level: 3, result_type: ResultType.COVERED }) };
    const service = new PaymentsService({} as any, caseRepository as any, {} as any);
    await expect(service.createOffer(2, { offer_type: ResultType.PAYABLE, offer_amount: 50 } as any))
      .rejects.toThrow('match the case result');
  });
});

describe('PaymentsService finance pagination', () => {
  it('limits ordinary list responses and loads history only for export', async () => {
    const query = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[{ id: 2 }], 130]),
    };
    const service = new PaymentsService({ createQueryBuilder: () => query } as any, {} as any, {} as any);
    await expect(service.findAll({}, 2, 50)).resolves.toEqual({ data: [{ id: 2 }], total: 130, page: 2, limit: 50 });
    expect(query.skip).toHaveBeenCalledWith(50);
    expect(query.take).toHaveBeenCalledWith(50);
    expect(query.leftJoinAndSelect).not.toHaveBeenCalledWith('case.status_history', 'history');
    await service.findAll({}, 1, 200, true);
    expect(query.leftJoinAndSelect).toHaveBeenCalledWith('case.status_history', 'history');
  });

  it('exports every matching payment across multiple batches', async () => {
    const allIds = Array.from({ length: 450 }, (_, index) => index + 1);
    const repository = {
      createQueryBuilder: jest.fn(() => {
        return {
          leftJoin: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn(async () => allIds.map((id) => ({ id }))),
        };
      }),
      find: jest.fn(async (options) => options.where.id.value.map((id) => ({
        id,
        created_at: new Date('2026-10-24T10:00:00Z'),
        updated_at: new Date('2026-10-24T10:00:00Z'),
      }))),
    };
    const service = new PaymentsService(repository as any, {} as any, {} as any);

    const csv = await service.exportFinanceCsv();

    expect(csv.split('\r\n')).toHaveLength(451);
    expect(csv).toContain('"450","2026-10-24 14:00:00"');
    expect(repository.find).toHaveBeenCalledTimes(3);
  });
});
