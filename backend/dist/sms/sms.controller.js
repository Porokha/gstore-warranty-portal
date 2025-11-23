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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const sms_service_1 = require("./sms.service");
const create_template_dto_1 = require("./dto/create-template.dto");
const update_settings_dto_1 = require("./dto/update-settings.dto");
const send_sms_dto_1 = require("./dto/send-sms.dto");
let SmsController = class SmsController {
    constructor(smsService) {
        this.smsService = smsService;
    }
    async sendSms(sendSmsDto) {
        return this.smsService.sendSms({
            phone: sendSmsDto.phone,
            templateKey: sendSmsDto.template_key,
            language: sendSmsDto.language,
            variables: sendSmsDto.variables || {},
        });
    }
    getAllTemplates() {
        return this.smsService.getAllTemplates();
    }
    getTemplate(id) {
        return this.smsService.getTemplateById(id);
    }
    createTemplate(createDto, user) {
        return this.smsService.createOrUpdateTemplate(createDto.key, createDto.language, createDto.template_text, user.id);
    }
    updateTemplate(key, language, templateText, user) {
        return this.smsService.createOrUpdateTemplate(key, language, templateText, user.id);
    }
    getSettings() {
        return this.smsService.getSettingsConfig();
    }
    updateSettings(updateDto, user) {
        return this.smsService.updateSettings(updateDto, user.id);
    }
    getLogs(limit) {
        return this.smsService.getLogs(limit ? parseInt(limit.toString()) : 100);
    }
};
exports.SmsController = SmsController;
__decorate([
    (0, common_1.Post)('send'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_sms_dto_1.SendSmsDto]),
    __metadata("design:returntype", Promise)
], SmsController.prototype, "sendSms", null);
__decorate([
    (0, common_1.Get)('templates'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SmsController.prototype, "getAllTemplates", null);
__decorate([
    (0, common_1.Get)('templates/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], SmsController.prototype, "getTemplate", null);
__decorate([
    (0, common_1.Post)('templates'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_template_dto_1.CreateTemplateDto, Object]),
    __metadata("design:returntype", void 0)
], SmsController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Put)('templates/:key/:language'),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Param)('language')),
    __param(2, (0, common_1.Body)('template_text')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], SmsController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Get)('settings'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SmsController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Put)('settings'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_settings_dto_1.UpdateSettingsDto, Object]),
    __metadata("design:returntype", void 0)
], SmsController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Get)('logs'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], SmsController.prototype, "getLogs", null);
exports.SmsController = SmsController = __decorate([
    (0, common_1.Controller)('sms'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [sms_service_1.SmsService])
], SmsController);
//# sourceMappingURL=sms.controller.js.map