import { SmsService } from './sms.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SendSmsDto } from './dto/send-sms.dto';
export declare class SmsController {
    private smsService;
    constructor(smsService: SmsService);
    sendSms(sendSmsDto: SendSmsDto): Promise<import("./entities/sms-log.entity").SmsLog>;
    getAllTemplates(): Promise<import("./entities/sms-template.entity").SmsTemplate[]>;
    getTemplate(id: number): Promise<import("./entities/sms-template.entity").SmsTemplate>;
    createTemplate(createDto: CreateTemplateDto, user: any): Promise<import("./entities/sms-template.entity").SmsTemplate>;
    updateTemplate(key: string, language: string, templateText: string, user: any): Promise<import("./entities/sms-template.entity").SmsTemplate>;
    getSettings(): Promise<import("./entities/sms-settings.entity").SmsSettings>;
    updateSettings(updateDto: UpdateSettingsDto, user: any): Promise<import("./entities/sms-settings.entity").SmsSettings>;
    getLogs(limit?: number): Promise<import("./entities/sms-log.entity").SmsLog[]>;
}
