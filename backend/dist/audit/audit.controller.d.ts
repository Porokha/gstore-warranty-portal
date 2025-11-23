import { AuditService } from './audit.service';
export declare class AuditController {
    private auditService;
    constructor(auditService: AuditService);
    findAll(userId?: string, action?: string, startDate?: string, endDate?: string): Promise<import("./entities/audit-log.entity").AuditLog[]>;
}
