import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
}

