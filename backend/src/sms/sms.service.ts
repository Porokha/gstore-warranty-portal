import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import { SmsTemplate, Language } from './entities/sms-template.entity';
import { SmsSettings } from './entities/sms-settings.entity';
import { SmsLog, SmsStatus } from './entities/sms-log.entity';

interface SendSmsOptions {
  phone: string;
  templateKey: string;
  language?: Language;
  variables?: Record<string, any>;
  skipIfDisabled?: boolean;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly api: AxiosInstance;
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly senderName: string;
  private settings: SmsSettings | null = null;

  constructor(
    private configService: ConfigService,
    @InjectRepository(SmsTemplate)
    private templatesRepository: Repository<SmsTemplate>,
    @InjectRepository(SmsSettings)
    private settingsRepository: Repository<SmsSettings>,
    @InjectRepository(SmsLog)
    private logsRepository: Repository<SmsLog>,
  ) {
    this.apiUrl = this.configService.get<string>('SENDER_API_URL') || 'https://api.sender.ge';
    this.apiKey = this.configService.get<string>('SENDER_API_KEY');
    this.senderName = this.configService.get<string>('SENDER_SENDER_NAME') || 'Gstore';

    if (!this.apiKey) {
      this.logger.warn('SMS API key not configured');
      return;
    }

    this.api = axios.create({
      baseURL: this.apiUrl,
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Load settings
    this.loadSettings();
  }

  private async loadSettings(): Promise<void> {
    try {
      this.settings = await this.settingsRepository.findOne({
        where: { id: 1 },
      });

      if (!this.settings) {
        // Create default settings
        this.settings = this.settingsRepository.create({
          id: 1,
          global_enabled: true,
          send_on_warranty_created: true,
          send_on_case_opened: true,
          send_on_status_change: true,
          send_on_offer_created: true,
          send_on_payment_confirmed: true,
          send_on_case_completed: true,
          send_on_sla_due: true,
          send_on_sla_stalled: true,
          send_on_sla_deadline_1day: true,
        });
        await this.settingsRepository.save(this.settings);
      }
    } catch (error) {
      this.logger.error('Failed to load SMS settings:', error.message);
    }
  }

  private async getSettings(): Promise<SmsSettings> {
    if (!this.settings) {
      await this.loadSettings();
    }
    return this.settings!;
  }

  private renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template;
    Object.keys(variables).forEach((key) => {
      const value = variables[key];
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      rendered = rendered.replace(regex, String(value));
    });
    return rendered;
  }

  async getTemplate(key: string, language: Language = Language.KA): Promise<SmsTemplate> {
    const template = await this.templatesRepository.findOne({
      where: { key, language },
    });

    if (!template) {
      // Try to get English template as fallback
      if (language !== Language.EN) {
        const enTemplate = await this.templatesRepository.findOne({
          where: { key, language: Language.EN },
        });
        if (enTemplate) {
          return enTemplate;
        }
      }
      throw new NotFoundException(`SMS template not found: ${key} (${language})`);
    }

    return template;
  }

  async sendSms(options: SendSmsOptions): Promise<SmsLog> {
    const { phone, templateKey, language = Language.KA, variables = {}, skipIfDisabled = true } = options;

    // Check if SMS is globally enabled
    const settings = await this.getSettings();
    if (!settings.global_enabled && skipIfDisabled) {
      this.logger.log(`SMS sending skipped: globally disabled`);
      return this.createLog(phone, templateKey, variables, SmsStatus.SKIPPED, 'SMS globally disabled');
    }

    // Check if specific event is enabled
    const eventEnabled = this.isEventEnabled(templateKey, settings);
    if (!eventEnabled && skipIfDisabled) {
      this.logger.log(`SMS sending skipped: event ${templateKey} disabled`);
      return this.createLog(phone, templateKey, variables, SmsStatus.SKIPPED, `Event ${templateKey} disabled`);
    }

    // Get template
    let template: SmsTemplate;
    try {
      template = await this.getTemplate(templateKey, language);
    } catch (error) {
      this.logger.error(`Template not found: ${templateKey}`, error.message);
      return this.createLog(phone, templateKey, variables, SmsStatus.FAILED, `Template not found: ${templateKey}`);
    }

    // Render template
    const message = this.renderTemplate(template.template_text, variables);

    // Send SMS via Sender API
    if (!this.apiKey) {
      this.logger.warn('SMS API key not configured, skipping send');
      return this.createLog(phone, templateKey, variables, SmsStatus.SKIPPED, 'API key not configured');
    }

    try {
      // Note: Adjust the API endpoint and request format based on Sender API documentation
      const response = await this.api.post('/v1/sms/send', {
        phone: phone,
        message: message,
        sender: this.senderName,
      });

      this.logger.log(`SMS sent successfully to ${phone} (template: ${templateKey})`);
      return this.createLog(phone, templateKey, variables, SmsStatus.SENT, JSON.stringify(response.data));
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phone}:`, error.message);
      return this.createLog(
        phone,
        templateKey,
        variables,
        SmsStatus.FAILED,
        error.response?.data || error.message,
      );
    }
  }

  private isEventEnabled(templateKey: string, settings: SmsSettings): boolean {
    if (templateKey.includes('warranty_created')) {
      return settings.send_on_warranty_created;
    }
    if (templateKey.includes('case_opened')) {
      return settings.send_on_case_opened;
    }
    if (templateKey.includes('status_change')) {
      return settings.send_on_status_change;
    }
    if (templateKey.includes('offer_created')) {
      return settings.send_on_offer_created;
    }
    if (templateKey.includes('payment_confirmed')) {
      return settings.send_on_payment_confirmed;
    }
    if (templateKey.includes('case_completed')) {
      return settings.send_on_case_completed;
    }
    if (templateKey.includes('sla_due')) {
      return settings.send_on_sla_due;
    }
    if (templateKey.includes('sla_stalled')) {
      return settings.send_on_sla_stalled;
    }
    if (templateKey.includes('sla_deadline_1day')) {
      return settings.send_on_sla_deadline_1day;
    }
    return true; // Default to enabled if event type not recognized
  }

  private async createLog(
    phone: string,
    templateKey: string,
    payload: Record<string, any>,
    status: SmsStatus,
    apiResponse?: string,
  ): Promise<SmsLog> {
    const log = this.logsRepository.create({
      phone,
      template_key: templateKey,
      payload_json: payload,
      status,
      api_response: apiResponse,
    });

    return this.logsRepository.save(log);
  }

  async getAllTemplates(): Promise<SmsTemplate[]> {
    return this.templatesRepository.find({
      order: { key: 'ASC', language: 'ASC' },
    });
  }

  async getTemplateById(id: number): Promise<SmsTemplate> {
    const template = await this.templatesRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`SMS template with ID ${id} not found`);
    }

    return template;
  }

  async createOrUpdateTemplate(
    key: string,
    language: Language,
    templateText: string,
    updatedBy: number,
  ): Promise<SmsTemplate> {
    let template = await this.templatesRepository.findOne({
      where: { key, language },
    });

    if (template) {
      template.template_text = templateText;
      template.updated_by = updatedBy;
    } else {
      template = this.templatesRepository.create({
        key,
        language,
        template_text: templateText,
        updated_by: updatedBy,
      });
    }

    return this.templatesRepository.save(template);
  }

  async getSettings(): Promise<SmsSettings> {
    return this.getSettings();
  }

  async updateSettings(settingsData: Partial<SmsSettings>, updatedBy: number): Promise<SmsSettings> {
    const settings = await this.getSettings();
    Object.assign(settings, settingsData);
    settings.updated_by = updatedBy;
    const saved = await this.settingsRepository.save(settings);
    this.settings = saved;
    return saved;
  }

  async getLogs(limit: number = 100): Promise<SmsLog[]> {
    return this.logsRepository.find({
      order: { created_at: 'DESC' },
      take: limit,
    });
  }
}
