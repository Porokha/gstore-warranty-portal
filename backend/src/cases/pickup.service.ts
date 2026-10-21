import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { EntityManager, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { PaymentStatus } from '../payments/entities/case-payment.entity';
import { CasePickup } from './entities/case-pickup.entity';
import { CaseStatusLevel, ResultType, ServiceCase } from './entities/service-case.entity';

const PIN_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

@Injectable()
export class PickupService {
  constructor(
    @InjectRepository(CasePickup) private readonly pickups: Repository<CasePickup>,
    @InjectRepository(ServiceCase) private readonly cases: Repository<ServiceCase>,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  private hash(caseId: number, code: string): string {
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET is required for pickup PINs');
    return createHmac('sha256', secret).update(`${caseId}:${code}`).digest('hex');
  }

  private async completedCase(caseId: number, manager = this.cases.manager): Promise<ServiceCase> {
    const case_ = await manager.findOne(ServiceCase, {
      where: { id: caseId },
      relations: ['payments'],
    });
    if (!case_) throw new NotFoundException('Service case not found');
    if (case_.status_level !== CaseStatusLevel.COMPLETED) {
      throw new BadRequestException('Collection is available only for completed cases');
    }
    if (case_.result_type === ResultType.PAYABLE && !case_.payments?.some(
      (payment) => payment.offer_type === ResultType.PAYABLE && payment.payment_status === PaymentStatus.PAID,
    )) {
      throw new BadRequestException('Payable case must be paid before collection');
    }
    return case_;
  }

  async status(caseId: number) {
    const case_ = await this.completedCase(caseId);
    const pickup = await this.pickups.findOne({ where: { case_id: caseId }, relations: ['collected_by_user'] });
    return {
      pin_required: case_.pickup_pin_required,
      issued_at: pickup?.issued_at || null,
      expires_at: pickup?.expires_at || null,
      collected_at: pickup?.collected_at || null,
      collected_by_user_id: pickup?.collected_by_user_id || null,
      collected_by_name: pickup?.collected_by_user
        ? `${pickup.collected_by_user.name || pickup.collected_by_user.username} ${pickup.collected_by_user.last_name || ''}`.trim()
        : null,
      has_active_pin: Boolean(pickup?.issued_at && pickup?.expires_at && !pickup?.collected_at && new Date(pickup.expires_at) > new Date()),
    };
  }

  async issue(caseId: number, userId: number) {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const now = new Date();
    await this.pickups.manager.transaction(async (manager) => {
      const case_ = await this.completedCase(caseId, manager);
      if (!case_.pickup_pin_required) throw new BadRequestException('This case does not require a pickup PIN');
      let pickup = await manager.findOne(CasePickup, { where: { case_id: caseId }, lock: { mode: 'pessimistic_write' }, select: ['case_id', 'collected_at'] });
      if (pickup?.collected_at) throw new BadRequestException('Device is already collected');
      if (!pickup) pickup = manager.create(CasePickup, { case_id: caseId });
      pickup.pin_hash = this.hash(caseId, code);
      pickup.issued_at = now;
      pickup.expires_at = new Date(now.getTime() + PIN_LIFETIME_MS);
      pickup.failed_attempts = 0;
      pickup.locked_until = null;
      await manager.save(pickup);
    });
    await this.audit.log(userId, 'CASE_PICKUP_PIN_ISSUED', { caseId });
    return { code, expires_at: new Date(now.getTime() + PIN_LIFETIME_MS) };
  }

  async verify(caseId: number, code: string, userId: number) {
    if (!/^\d{6}$/.test(code || '')) throw new BadRequestException('Enter the six-digit pickup PIN');
    const result = await this.pickups.manager.transaction(async (manager) => {
      const case_ = await this.completedCase(caseId, manager);
      if (!case_.pickup_pin_required) throw new BadRequestException('This case does not require a pickup PIN');
      const pickup = await manager.findOne(CasePickup, {
        where: { case_id: caseId },
        lock: { mode: 'pessimistic_write' },
        select: ['case_id', 'pin_hash', 'expires_at', 'failed_attempts', 'locked_until', 'collected_at'],
      });
      if (!pickup?.pin_hash || !pickup.expires_at || new Date(pickup.expires_at) <= new Date() || pickup.collected_at) {
        return { error: 'Pickup PIN is unavailable or expired' };
      }
      const now = new Date();
      if (pickup.locked_until && new Date(pickup.locked_until) > now) return { error: 'Too many attempts. Try again later' };
      const expected = Buffer.from(pickup.pin_hash, 'hex');
      const supplied = Buffer.from(this.hash(caseId, code), 'hex');
      if (!timingSafeEqual(expected, supplied)) {
        pickup.failed_attempts = (pickup.locked_until ? 0 : pickup.failed_attempts) + 1;
        pickup.locked_until = pickup.failed_attempts >= MAX_ATTEMPTS ? new Date(now.getTime() + LOCKOUT_MS) : null;
        await manager.save(pickup);
        return { error: pickup.locked_until ? 'Too many attempts. Try again later' : 'Invalid pickup PIN' };
      }
      pickup.collected_at = now;
      pickup.collected_by_user_id = userId;
      pickup.pin_hash = null;
      pickup.locked_until = null;
      await manager.save(pickup);
      return { collected_at: now, collected_by_user_id: userId };
    });
    if ('error' in result) throw new ForbiddenException(result.error);
    await this.audit.log(userId, 'CASE_DEVICE_COLLECTED', { caseId, collectedAt: result.collected_at });
    return result;
  }

  async collectWithoutPin(caseId: number, userId: number) {
    const result = await this.pickups.manager.transaction(async (manager) => {
      // Serialize collection attempts, including the first one before a pickup row exists.
      await manager.findOne(ServiceCase, { where: { id: caseId }, lock: { mode: 'pessimistic_write' } });
      const case_ = await this.completedCase(caseId, manager);
      if (case_.pickup_pin_required) throw new BadRequestException('Pickup PIN is required for this case');
      let pickup = await manager.findOne(CasePickup, { where: { case_id: caseId }, lock: { mode: 'pessimistic_write' } });
      if (pickup?.collected_at) throw new BadRequestException('Device is already collected');
      if (!pickup) pickup = manager.create(CasePickup, { case_id: caseId });
      pickup.collected_at = new Date();
      pickup.collected_by_user_id = userId;
      await manager.save(pickup);
      return { collected_at: pickup.collected_at, collected_by_user_id: userId };
    });
    await this.audit.log(userId, 'CASE_DEVICE_COLLECTED_WITHOUT_PIN', { caseId, collectedAt: result.collected_at });
    return result;
  }

  async resetForReopen(caseId: number, userId: number, manager: EntityManager = this.pickups.manager) {
    const pickup = await manager.findOne(CasePickup, { where: { case_id: caseId }, lock: { mode: 'pessimistic_write' } });
    if (!pickup) return;
    await manager.getRepository(AuditLog).save(manager.getRepository(AuditLog).create({
      user_id: userId,
      action: 'CASE_PICKUP_RESET_ON_REOPEN',
      payload_json: { caseId, collectedAt: pickup.collected_at },
    }));
    await manager.getRepository(CasePickup).update(caseId, {
      pin_hash: null,
      issued_at: null,
      expires_at: null,
      failed_attempts: 0,
      locked_until: null,
      collected_at: null,
      collected_by_user_id: null,
    });
  }
}
