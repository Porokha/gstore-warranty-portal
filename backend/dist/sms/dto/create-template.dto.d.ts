import { Language } from '../entities/sms-template.entity';
export declare class CreateTemplateDto {
    key: string;
    language: Language;
    template_text: string;
}
