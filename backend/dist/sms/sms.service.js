"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = require("axios");
const sms_template_entity_1 = require("./entities/sms-template.entity");
const sms_settings_entity_1 = require("./entities/sms-settings.entity");
const sms_log_entity_1 = require("./entities/sms-log.entity");
let SmsService = SmsService_1 = class SmsService {
    constructor(configService, templatesRepository, settingsRepository, logsRepository) {
        this.configService = configService;
        this.templatesRepository = templatesRepository;
        this.settingsRepository = settingsRepository;
        this.logsRepository = logsRepository;
        this.logger = new common_1.Logger(SmsService_1.name);
        this.settings = null;
        this.apiUrl = this.configService.get('SENDER_API_URL') || 'https://api.sender.ge';
        this.apiKey = this.configService.get('SENDER_API_KEY');
        this.senderName = this.configService.get('SENDER_SENDER_NAME') || 'Gstore';
        if (!this.apiKey) {
            this.logger.warn('SMS API key not configured');
            return;
        }
        this.api = axios_1.default.create({
            baseURL: this.apiUrl,
            timeout: 10000,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
        });
        this.loadSettings();
    }
    async loadSettings() {
        try {
            this.settings = await this.settingsRepository.findOne({
                where: { id: 1 },
            });
            if (!this.settings) {
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
        }
        catch (error) {
            this.logger.error('Failed to load SMS settings:', error.message);
        }
    }
    async getSettings() {
        if (!this.settings) {
            await this.loadSettings();
        }
        return this.settings;
    }
    renderTemplate(template, variables) {
        let rendered = template;
        Object.keys(variables).forEach((key) => {
            const value = variables[key];
            const regex = new RegExp(`\\{${key}\\}`, 'g');
            rendered = rendered.replace(regex, String(value));
        });
        return rendered;
    }
    async getTemplate(key, language = sms_template_entity_1.Language.KA) {
        const template = await this.templatesRepository.findOne({
            where: { key, language },
        });
        if (!template) {
            if (language !== sms_template_entity_1.Language.EN) {
                const enTemplate = await this.templatesRepository.findOne({
                    where: { key, language: sms_template_entity_1.Language.EN },
                });
                if (enTemplate) {
                    return enTemplate;
                }
            }
            throw new common_1.NotFoundException(`SMS template not found: ${key} (${language})`);
        }
        return template;
    }
    async sendSms(options) {
        const { phone, templateKey, language = sms_template_entity_1.Language.KA, variables = {}, skipIfDisabled = true } = options;
        const settings = await this.getSettings();
        if (!settings.global_enabled && skipIfDisabled) {
            this.logger.log(`SMS sending skipped: globally disabled`);
            return this.createLog(phone, templateKey, variables, sms_log_entity_1.SmsStatus.SKIPPED, 'SMS globally disabled');
        }
        const eventEnabled = this.isEventEnabled(templateKey, settings);
        if (!eventEnabled && skipIfDisabled) {
            this.logger.log(`SMS sending skipped: event ${templateKey} disabled`);
            return this.createLog(phone, templateKey, variables, sms_log_entity_1.SmsStatus.SKIPPED, `Event ${templateKey} disabled`);
        }
        let template;
        try {
            template = await this.getTemplate(templateKey, language);
        }
        catch (error) {
            this.logger.error(`Template not found: ${templateKey}`, error.message);
            return this.createLog(phone, templateKey, variables, sms_log_entity_1.SmsStatus.FAILED, `Template not found: ${templateKey}`);
        }
        const message = this.renderTemplate(template.template_text, variables);
        if (!this.apiKey) {
            this.logger.warn('SMS API key not configured, skipping send');
            return this.createLog(phone, templateKey, variables, sms_log_entity_1.SmsStatus.SKIPPED, 'API key not configured');
        }
        try {
            const response = await this.api.post('/v1/sms/send', {
                phone: phone,
                message: message,
                sender: this.senderName,
            });
            this.logger.log(`SMS sent successfully to ${phone} (template: ${templateKey})`);
            return this.createLog(phone, templateKey, variables, sms_log_entity_1.SmsStatus.SENT, JSON.stringify(response.data));
        }
        catch (error) {
            this.logger.error(`Failed to send SMS to ${phone}:`, error.message);
            return this.createLog(phone, templateKey, variables, sms_log_entity_1.SmsStatus.FAILED, error.response?.data || error.message);
        }
    }
    isEventEnabled(templateKey, settings) {
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
        return true;
    }
    async createLog(phone, templateKey, payload, status, apiResponse) {
        const log = this.logsRepository.create({
            phone,
            template_key: templateKey,
            payload_json: payload,
            status,
            api_response: apiResponse,
        });
        return this.logsRepository.save(log);
    }
    async getAllTemplates() {
        return this.templatesRepository.find({
            order: { key: 'ASC', language: 'ASC' },
        });
    }
    async getTemplateById(id) {
        const template = await this.templatesRepository.findOne({
            where: { id },
        });
        if (!template) {
            throw new common_1.NotFoundException(`SMS template with ID ${id} not found`);
        }
        return template;
    }
    async createOrUpdateTemplate(key, language, templateText, updatedBy) {
        let template = await this.templatesRepository.findOne({
            where: { key, language },
        });
        if (template) {
            template.template_text = templateText;
            template.updated_by = updatedBy;
        }
        else {
            template = this.templatesRepository.create({
                key,
                language,
                template_text: templateText,
                updated_by: updatedBy,
            });
        }
        return this.templatesRepository.save(template);
    }
    async getSettingsConfig() {
        return await this.getSettings();
    }
    async updateSettings(settingsData, updatedBy) {
        const settings = await this.getSettings();
        Object.assign(settings, settingsData);
        settings.updated_by = updatedBy;
        const saved = await this.settingsRepository.save(settings);
        this.settings = saved;
        return saved;
    }
    async getLogs(limit = 100) {
        return this.logsRepository.find({
            order: { created_at: 'DESC' },
            take: limit,
        });
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = SmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(sms_template_entity_1.SmsTemplate)),
    __param(2, (0, typeorm_1.InjectRepository)(sms_settings_entity_1.SmsSettings)),
    __param(3, (0, typeorm_1.InjectRepository)(sms_log_entity_1.SmsLog)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SmsService);
//# sourceMappingURL=sms.service.js.map