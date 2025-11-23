import { Language } from '../entities/sms-template.entity';
export declare class SendSmsDto {
    phone: string;
    template_key: string;
    language?: Language;
    variables?: Record<string, any>;
}
