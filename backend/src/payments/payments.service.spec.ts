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
