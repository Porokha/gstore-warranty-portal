import { User } from '../../users/entities/user.entity';
export declare enum Language {
    EN = "en",
    KA = "ka"
}
export declare class SmsTemplate {
    id: number;
    key: string;
    language: Language;
    template_text: string;
    updated_by: number;
    updated_at: Date;
    updated_by_user: User;
}
