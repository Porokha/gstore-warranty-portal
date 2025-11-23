import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { SmsTemplate, Language } from './entities/sms-template.entity';
import { SmsSettings } from './entities/sms-settings.entity';
import { SmsLog } from './entities/sms-log.entity';
interface SendSmsOptions {
    phone: string;
    templateKey: string;
    language?: Language;
    variables?: Record<string, any>;
    skipIfDisabled?: boolean;
}
export declare class SmsService {
    private configService;
    private templatesRepository;
    private settingsRepository;
    private logsRepository;
    private readonly logger;
    private readonly api;
    private readonly apiUrl;
    private readonly apiKey;
    private readonly senderName;
    private settings;
    constructor(configService: ConfigService, templatesRepository: Repository<SmsTemplate>, settingsRepository: Repository<SmsSettings>, logsRepository: Repository<SmsLog>);
    private loadSettings;
    private getSettings;
    private renderTemplate;
    getTemplate(key: string, language?: Language): Promise<SmsTemplate>;
    sendSms(options: SendSmsOptions): Promise<SmsLog>;
    private isEventEnabled;
    private createLog;
    getAllTemplates(): Promise<SmsTemplate[]>;
    getTemplateById(id: number): Promise<SmsTemplate>;
    createOrUpdateTemplate(key: string, language: Language, templateText: string, updatedBy: number): Promise<SmsTemplate>;
    getSettingsConfig(): Promise<SmsSettings>;
    updateSettings(settingsData: Partial<SmsSettings>, updatedBy: number): Promise<SmsSettings>;
    getLogs(limit?: number): Promise<SmsLog[]>;
}
export {};
