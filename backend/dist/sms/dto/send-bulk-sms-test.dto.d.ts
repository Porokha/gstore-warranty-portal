import { Language } from '../entities/sms-template.entity';
export declare class SendBulkSmsTestDto {
    template_key?: string;
    language?: Language;
    message_text?: string;
    phones: string[];
}
