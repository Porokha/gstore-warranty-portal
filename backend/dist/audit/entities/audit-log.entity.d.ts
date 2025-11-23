import { User } from '../../users/entities/user.entity';
export declare class AuditLog {
    id: number;
    user_id: number;
    action: string;
    payload_json: Record<string, any>;
    created_at: Date;
    user: User;
}
