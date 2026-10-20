import { BadRequestException } from '@nestjs/common';
import { PaymentStatus } from './entities/case-payment.entity';
import { ResultType } from '../cases/entities/service-case.entity';
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
