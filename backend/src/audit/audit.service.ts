import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThanOrEqual, Like } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async log(userId: number, action: string, payload: any) {
    const log = this.auditRepository.create({
      user_id: userId,
      action,
      payload_json: payload,
    });
    return this.auditRepository.save(log);
  }

  async findAll(filters?: {
    user_id?: number;
    action?: string;
    start_date?: Date;
    end_date?: Date;
  }) {
    const query = this.auditRepository.createQueryBuilder('audit')
      .leftJoinAndSelect('audit.user', 'user')
      .orderBy('audit.created_at', 'DESC');

    if (filters?.user_id) {
      query.andWhere('audit.user_id = :user_id', { user_id: filters.user_id });
    }

    if (filters?.action) {
      query.andWhere('audit.action LIKE :action', { action: `%${filters.action}%` });
    }

    if (filters?.start_date) {
      query.andWhere('audit.created_at >= :start_date', { start_date: filters.start_date });
    }

    if (filters?.end_date) {
      query.andWhere('audit.created_at <= :end_date', { end_date: filters.end_date });
    }

    return query.getMany();
  }
}

