import { ServiceCase } from '../../cases/entities/service-case.entity';
import { CaseStatusHistory } from '../../cases/entities/case-status-history.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';
export declare enum UserRole {
    ADMIN = "admin",
    TECHNICIAN = "technician"
}
export declare enum LanguagePreference {
    EN = "en",
    KA = "ka"
}
export declare class User {
    id: number;
    name: string;
    last_name: string;
    username: string;
    password_hash: string;
    role: UserRole;
    phone: string;
    email: string;
    language_pref: LanguagePreference;
    created_at: Date;
    updated_at: Date;
    assigned_cases: ServiceCase[];
    created_cases: ServiceCase[];
    status_changes: CaseStatusHistory[];
    audit_logs: AuditLog[];
}
