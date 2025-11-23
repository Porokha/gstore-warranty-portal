import { User } from '../../users/entities/user.entity';
export declare class SmsSettings {
    id: number;
    global_enabled: boolean;
    send_on_warranty_created: boolean;
    send_on_case_opened: boolean;
    send_on_status_change: boolean;
    send_on_offer_created: boolean;
    send_on_payment_confirmed: boolean;
    send_on_case_completed: boolean;
    send_on_sla_due: boolean;
    send_on_sla_stalled: boolean;
    send_on_sla_deadline_1day: boolean;
    updated_by: number;
    updated_at: Date;
    updated_by_user: User;
}
