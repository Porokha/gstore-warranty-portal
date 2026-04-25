import { SmsService } from './sms.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SendSmsDto } from './dto/send-sms.dto';
import { SendTemplateTestDto } from './dto/send-template-test.dto';
import { SendBulkSmsTestDto } from './dto/send-bulk-sms-test.dto';
export declare class SmsController {
    private smsService;
    constructor(smsService: SmsService);
    sendSms(sendSmsDto: SendSmsDto): Promise<import("./entities/sms-log.entity").SmsLog>;
    getAllTemplates(): Promise<import("./entities/sms-template.entity").SmsTemplate[]>;
    getTemplate(id: number): Promise<import("./entities/sms-template.entity").SmsTemplate>;
    sendTemplateTest(dto: SendTemplateTestDto): Promise<{
        template_key: string;
        language: import("./entities/sms-template.entity").Language;
        total: number;
        sent: number;
        failed: number;
        skipped: number;
        results: import("./entities/sms-log.entity").SmsLog[];
    }>;
    sendBulkSmsTest(dto: SendBulkSmsTestDto): Promise<{
        total: number;
        sent: number;
        failed: number;
        skipped: number;
        results: import("./entities/sms-log.entity").SmsLog[];
    }>;
    createTemplate(createDto: CreateTemplateDto, user: any): Promise<import("./entities/sms-template.entity").SmsTemplate>;
    updateTemplate(key: string, language: string, templateText: string, user: any): Promise<import("./entities/sms-template.entity").SmsTemplate>;
    getSettings(): Promise<import("./entities/sms-settings.entity").SmsSettings>;
    updateSettings(updateDto: UpdateSettingsDto, user: any): Promise<import("./entities/sms-settings.entity").SmsSettings>;
    getLogs(limit?: number): Promise<import("./entities/sms-log.entity").SmsLog[]>;
}
