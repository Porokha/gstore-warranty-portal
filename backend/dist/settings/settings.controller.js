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
var SettingsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const settings_service_1 = require("./settings.service");
let SettingsController = SettingsController_1 = class SettingsController {
    constructor(settingsService) {
        this.settingsService = settingsService;
        this.logger = new common_1.Logger(SettingsController_1.name);
        this.logger.log('SettingsController initialized');
    }
    async getApiKeys() {
        this.logger.log('GET /api/settings/api-keys - Retrieving API keys');
        const keys = await this.settingsService.getApiKeys();
        this.logger.log(`📋 Retrieved API keys - URL: ${keys.woocommerce_url ? `set (${keys.woocommerce_url})` : 'missing'}, Key: ${keys.woocommerce_consumer_key ? `set (${keys.woocommerce_consumer_key.length} chars)` : 'missing'}, Secret: ${keys.woocommerce_consumer_secret ? `set (${keys.woocommerce_consumer_secret.length} chars)` : 'missing'}`);
        return keys;
    }
    async setApiKeys(keys) {
        this.logger.log('💾 POST /api/settings/api-keys - Saving API keys');
        this.logger.log('📥 Received keys:', {
            hasUrl: !!keys.woocommerce_url,
            hasKey: !!keys.woocommerce_consumer_key,
            hasSecret: !!keys.woocommerce_consumer_secret,
            url: keys.woocommerce_url || 'MISSING',
            keyLength: keys.woocommerce_consumer_key?.length || 0,
            secretLength: keys.woocommerce_consumer_secret?.length || 0,
        });
        try {
            await this.settingsService.setApiKeys(keys);
            this.logger.log('✅ API keys saved to database');
            const saved = await this.settingsService.getApiKeys();
            this.logger.log(`🔍 Verified saved keys - URL: ${saved.woocommerce_url ? `set (${saved.woocommerce_url})` : 'missing'}, Key: ${saved.woocommerce_consumer_key ? `set (${saved.woocommerce_consumer_key.length} chars)` : 'missing'}, Secret: ${saved.woocommerce_consumer_secret ? `set (${saved.woocommerce_consumer_secret.length} chars)` : 'missing'}`);
            return {
                success: true,
                message: 'API keys updated successfully',
                saved: {
                    hasUrl: !!saved.woocommerce_url,
                    hasKey: !!saved.woocommerce_consumer_key,
                    hasSecret: !!saved.woocommerce_consumer_secret,
                }
            };
        }
        catch (error) {
            this.logger.error('❌ Failed to save API keys:', error);
            this.logger.error('Error details:', error.message, error.stack);
            throw new Error(`Failed to save API keys: ${error.message}`);
        }
    }
    async getWooCommerceAutomation() {
        const enabled = await this.settingsService.get('WOOCOMMERCE_AUTOMATION_ENABLED');
        return { enabled: enabled === 'true' };
    }
    async setWooCommerceAutomation(body) {
        await this.settingsService.set('WOOCOMMERCE_AUTOMATION_ENABLED', body.enabled ? 'true' : 'false', 'Enable/disable automatic warranty creation from WooCommerce completed orders');
        return { success: true, message: 'WooCommerce automation setting updated successfully' };
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, common_1.Get)('api-keys'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getApiKeys", null);
__decorate([
    (0, common_1.Post)('api-keys'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "setApiKeys", null);
__decorate([
    (0, common_1.Get)('woocommerce-automation'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getWooCommerceAutomation", null);
__decorate([
    (0, common_1.Post)('woocommerce-automation'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "setWooCommerceAutomation", null);
exports.SettingsController = SettingsController = SettingsController_1 = __decorate([
    (0, common_1.Controller)('settings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], SettingsController);
//# sourceMappingURL=settings.controller.js.map