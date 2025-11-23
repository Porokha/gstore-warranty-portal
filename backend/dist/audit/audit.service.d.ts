import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
export declare class AuditService {
    private auditRepository;
    constructor(auditRepository: Repository<AuditLog>);
    log(userId: number, action: string, payload: any): Promise<AuditLog>;
    findAll(filters?: {
        user_id?: number;
        action?: string;
        start_date?: Date;
        end_date?: Date;
    }): Promise<AuditLog[]>;
}
