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
import { Setting } from '../settings/settings.entity';
import { Warranty } from '../warranties/entities/warranty.entity';

interface SendSmsOptions {
  phone: string;
  templateKey: string;
  eventType?: string;
  language?: Language;
  variables?: Record<string, any>;
  skipIfDisabled?: boolean;
}

interface SendTemplateTestOptions {
  templateKey: string;
  language: Language;
  phones: string[];
}

interface SendBulkSmsTestOptions {
  phones: string[];
  templateKey?: string;
  language?: Language;
  messageText?: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly api: AxiosInstance;
  private readonly defaultApiUrl: string;
  private readonly defaultSendPath: string;
  private readonly defaultApiKey: string;
  private readonly smsNo: number;
  private readonly priority: number;
  private settings: SmsSettings | null = null;

  constructor(
    private configService: ConfigService,
    @InjectRepository(SmsTemplate)
    private templatesRepository: Repository<SmsTemplate>,
    @InjectRepository(SmsSettings)
    private settingsRepository: Repository<SmsSettings>,
    @InjectRepository(SmsLog)
    private logsRepository: Repository<SmsLog>,
    @InjectRepository(Setting)
    private appSettingsRepository: Repository<Setting>,
  ) {
    const configuredApiUrl = (this.configService.get<string>('SENDER_API_URL') || 'https://sender.ge').replace(/\/+$/, '');
    if (configuredApiUrl.endsWith('/api/send.php')) {
      this.defaultApiUrl = configuredApiUrl.replace(/\/api\/send\.php$/, '');
      this.defaultSendPath = '/api/send.php';
    } else {
      this.defaultApiUrl = configuredApiUrl;
      this.defaultSendPath = '/api/send.php';
    }
    this.defaultApiKey = this.configService.get<string>('SENDER_API_KEY');
    this.smsNo = Number(this.configService.get<string>('SENDER_SMSNO') || '1');
    this.priority = Number(this.configService.get<string>('SENDER_PRIORITY') || '0');

    if (!this.defaultApiKey) {
      this.logger.warn('SMS API key not configured');
    }

    this.api = axios.create({
      timeout: 30000,
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
          template_warranty_created_key: 'sms.warranty.created',
          send_on_case_opened: true,
          template_case_opened_key: 'sms.case.opened',
          send_on_status_change: true,
          template_status_change_key: 'sms.case.status_change',
          send_on_offer_created: true,
          template_offer_created_key: 'sms.offer.created',
          send_on_payment_confirmed: true,
          template_payment_confirmed_key: 'sms.payment.confirmed',
          send_on_case_completed: true,
          template_case_completed_key: 'sms.case.completed',
          send_on_sla_due: true,
          template_sla_due_key: 'sms.sla_due',
          send_on_sla_stalled: true,
          template_sla_stalled_key: 'sms.sla_stalled',
          send_on_sla_deadline_1day: true,
          template_sla_deadline_1day_key: 'sms.sla_deadline_1day',
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

  private normalizePhones(phones: string[]): string[] {
    return Array.from(
      new Set(
        phones
          .map((phone) => phone.trim())
          .filter(Boolean),
      ),
    );
  }

  private formatPhoneNumber(phone: string): string {
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits.startsWith('995') && digits.length === 12) {
      return digits.slice(3);
    }
    if (digits.length === 9 && digits.startsWith('5')) {
      return digits;
    }
    throw new BadRequestException('Invalid Georgian mobile number format. Expected: 5xxxxxxxx');
  }

  private validateMessage(message: string): string {
    const normalized = String(message || '').trim();
    if (!normalized) {
      throw new BadRequestException('Message content is required');
    }
    if (normalized.length > 1000) {
      throw new BadRequestException('Message is too long (max 1000 characters)');
    }
    return normalized;
  }

  private normalizeSenderUrl(configuredApiUrl?: string | null) {
    const normalized = String(configuredApiUrl || this.defaultApiUrl || 'https://sender.ge').trim().replace(/\/+$/, '');
    if (normalized.endsWith('/api/send.php')) {
      return {
        apiUrl: normalized.replace(/\/api\/send\.php$/, ''),
        sendPath: '/api/send.php',
      };
    }
    return {
      apiUrl: normalized,
      sendPath: this.defaultSendPath,
    };
  }

  private async getSenderRuntimeConfig() {
    const [apiKeySetting, apiUrlSetting] = await Promise.all([
      this.appSettingsRepository.findOne({ where: { key: 'SENDER_API_KEY' } }),
      this.appSettingsRepository.findOne({ where: { key: 'SENDER_API_URL' } }),
    ]);

    const { apiUrl, sendPath } = this.normalizeSenderUrl(apiUrlSetting?.value);
    return {
      apiKey: apiKeySetting?.value || this.defaultApiKey,
      apiUrl,
      sendPath,
    };
  }

  private async deliverSms(
    phone: string,
    message: string,
    templateKey: string,
    payload: Record<string, any>,
  ): Promise<SmsLog> {
    const senderConfig = await this.getSenderRuntimeConfig();
    if (!senderConfig.apiKey) {
      this.logger.warn('SMS API key not configured, skipping send');
      return this.createLog(phone, templateKey, payload, SmsStatus.SKIPPED, 'API key not configured');
    }

    try {
      const destination = this.formatPhoneNumber(phone);
      const content = this.validateMessage(message);
      const requestPayload = new URLSearchParams({
        apikey: senderConfig.apiKey,
        smsno: String(this.smsNo),
        destination,
        content,
        priority: String(this.priority),
      });
      const response = await this.api.post(`${senderConfig.apiUrl}${senderConfig.sendPath}`, requestPayload.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const providerData = response?.data?.data?.[0];
      if (!providerData) {
        throw new Error(`Invalid response format from API: ${JSON.stringify(response?.data)}`);
      }

      this.logger.log(`SMS sent successfully to ${phone} (template: ${templateKey})`);
      return this.createLog(
        phone,
        templateKey,
        {
          ...payload,
          destination,
          smsno: this.smsNo,
          priority: this.priority,
          api_url: `${senderConfig.apiUrl}${senderConfig.sendPath}`,
        },
        SmsStatus.SENT,
        JSON.stringify(response.data),
      );
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phone}:`, error.message);
      return this.createLog(
        phone,
        templateKey,
        {
          ...payload,
          smsno: this.smsNo,
          priority: this.priority,
          api_url: `${senderConfig.apiUrl}${senderConfig.sendPath}`,
        },
        SmsStatus.FAILED,
        typeof error.response?.data === 'string'
          ? error.response.data
          : JSON.stringify(error.response?.data || { message: error.message }),
      );
    }
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
    const {
      phone,
      templateKey,
      eventType,
      language = Language.KA,
      variables = {},
      skipIfDisabled = true,
    } = options;

    // Check if SMS is globally enabled
    const settings = await this.getSettings();
    if (!settings.global_enabled && skipIfDisabled) {
      this.logger.log(`SMS sending skipped: globally disabled`);
      return this.createLog(phone, templateKey, variables, SmsStatus.SKIPPED, 'SMS globally disabled');
    }

    // Check if specific event is enabled
    const resolvedEventType = eventType || templateKey;
    const eventEnabled = this.isEventEnabled(resolvedEventType, settings);
    if (!eventEnabled && skipIfDisabled) {
      this.logger.log(`SMS sending skipped: event ${resolvedEventType} disabled`);
      return this.createLog(phone, templateKey, variables, SmsStatus.SKIPPED, `Event ${resolvedEventType} disabled`);
    }

    const effectiveTemplateKey = this.resolveTemplateKey(resolvedEventType, templateKey, settings);

    // Get template
    let template: SmsTemplate;
    try {
      template = await this.getTemplate(effectiveTemplateKey, language);
    } catch (error) {
      this.logger.error(`Template not found: ${effectiveTemplateKey}`, error.message);
      return this.createLog(phone, effectiveTemplateKey, variables, SmsStatus.FAILED, `Template not found: ${effectiveTemplateKey}`);
    }

    // Render template
    const message = this.renderTemplate(template.template_text, variables);

    return this.deliverSms(phone, message, effectiveTemplateKey, variables);
  }

  private isEventEnabled(eventType: string, settings: SmsSettings): boolean {
    if (eventType.includes('warranty_created')) {
      return settings.send_on_warranty_created;
    }
    if (eventType.includes('case_opened')) {
      return settings.send_on_case_opened;
    }
    if (eventType.includes('status_change')) {
      return settings.send_on_status_change;
    }
    if (eventType.includes('offer_created')) {
      return settings.send_on_offer_created;
    }
    if (eventType.includes('payment_confirmed')) {
      return settings.send_on_payment_confirmed;
    }
    if (eventType.includes('case_completed')) {
      return settings.send_on_case_completed;
    }
    if (eventType.includes('sla_due')) {
      return settings.send_on_sla_due;
    }
    if (eventType.includes('sla_stalled')) {
      return settings.send_on_sla_stalled;
    }
    if (eventType.includes('sla_deadline_1day')) {
      return settings.send_on_sla_deadline_1day;
    }
    return true; // Default to enabled if event type not recognized
  }

  private resolveTemplateKey(eventType: string, fallbackTemplateKey: string, settings: SmsSettings): string {
    if (eventType.includes('warranty_created')) {
      return settings.template_warranty_created_key || fallbackTemplateKey;
    }
    if (eventType.includes('case_opened')) {
      return settings.template_case_opened_key || fallbackTemplateKey;
    }
    if (eventType.includes('status_change')) {
      return settings.template_status_change_key || fallbackTemplateKey;
    }
    if (eventType.includes('offer_created')) {
      return settings.template_offer_created_key || fallbackTemplateKey;
    }
    if (eventType.includes('payment_confirmed')) {
      return settings.template_payment_confirmed_key || fallbackTemplateKey;
    }
    if (eventType.includes('case_completed')) {
      return settings.template_case_completed_key || fallbackTemplateKey;
    }
    if (eventType.includes('sla_due')) {
      return settings.template_sla_due_key || fallbackTemplateKey;
    }
    if (eventType.includes('sla_stalled')) {
      return settings.template_sla_stalled_key || fallbackTemplateKey;
    }
    if (eventType.includes('sla_deadline_1day')) {
      return settings.template_sla_deadline_1day_key || fallbackTemplateKey;
    }
    return fallbackTemplateKey;
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

  async getSettingsConfig(): Promise<SmsSettings> {
    return await this.getSettings();
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

  async notifyWarrantyCreated(warranty: Warranty): Promise<SmsLog | null> {
    if (!warranty?.customer_phone) {
      return null;
    }

    return this.sendSms({
      phone: warranty.customer_phone,
      templateKey: 'sms.warranty.created',
      eventType: 'sms.warranty_created',
      language: Language.KA,
      variables: {
        warranty_id: warranty.warranty_id,
        customer_name: warranty.customer_name,
        customer_last_name: warranty.customer_last_name || '',
        product_title: warranty.title,
        serial_number: warranty.serial_number,
        imei: warranty.imei || '',
        warranty_end: new Date(warranty.warranty_end).toLocaleDateString('ka-GE'),
      },
    });
  }

  async sendTemplateTest(options: SendTemplateTestOptions) {
    const { templateKey, language, phones } = options;

    const normalizedPhones = this.normalizePhones(phones);

    if (normalizedPhones.length === 0) {
      throw new BadRequestException('At least one phone number is required');
    }

    const results: SmsLog[] = [];
    for (const phone of normalizedPhones) {
      const log = await this.sendSms({
        phone,
        templateKey,
        language,
        variables: {},
        skipIfDisabled: false,
      });
      results.push(log);
    }

    return {
      template_key: templateKey,
      language,
      total: normalizedPhones.length,
      sent: results.filter((item) => item.status === SmsStatus.SENT).length,
      failed: results.filter((item) => item.status === SmsStatus.FAILED).length,
      skipped: results.filter((item) => item.status === SmsStatus.SKIPPED).length,
      results,
    };
  }

  async sendBulkSmsTest(options: SendBulkSmsTestOptions) {
    const { templateKey, language = Language.KA, messageText } = options;
    const phones = this.normalizePhones(options.phones);

    if (phones.length === 0) {
      throw new BadRequestException('At least one phone number is required');
    }

    const usingTemplate = Boolean(templateKey);
    const usingManualText = Boolean(messageText && messageText.trim());

    if (!usingTemplate && !usingManualText) {
      throw new BadRequestException('Choose a template or enter custom text');
    }

    if (usingTemplate && usingManualText) {
      throw new BadRequestException('Use either template mode or custom text mode');
    }

    const results: SmsLog[] = [];

    if (usingTemplate) {
      const template = await this.getTemplate(templateKey!, language);
      const renderedText = this.renderTemplate(template.template_text, {});

      for (const phone of phones) {
        results.push(
          await this.deliverSms(phone, renderedText, templateKey!, { mode: 'template_test', language }),
        );
      }
    } else {
      const trimmedMessage = messageText!.trim();
      for (const phone of phones) {
        results.push(
          await this.deliverSms(phone, trimmedMessage, 'manual.test', { mode: 'manual_test' }),
        );
      }
    }

    return {
      total: phones.length,
      sent: results.filter((item) => item.status === SmsStatus.SENT).length,
      failed: results.filter((item) => item.status === SmsStatus.FAILED).length,
      skipped: results.filter((item) => item.status === SmsStatus.SKIPPED).length,
      results,
    };
  }
}
