import { Language } from '../entities/sms-template.entity';
export declare class SendTemplateTestDto {
    template_key: string;
    language: Language;
    phones: string[];
}
