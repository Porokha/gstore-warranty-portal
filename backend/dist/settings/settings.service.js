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
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const settings_entity_1 = require("./settings.entity");
let SettingsService = class SettingsService {
    constructor(settingsRepository) {
        this.settingsRepository = settingsRepository;
    }
    async get(key) {
        const setting = await this.settingsRepository.findOne({ where: { key } });
        return setting ? setting.value : null;
    }
    async set(key, value, description) {
        let setting = await this.settingsRepository.findOne({ where: { key } });
        if (setting) {
            setting.value = value;
            if (description)
                setting.description = description;
        }
        else {
            setting = this.settingsRepository.create({ key, value, description });
        }
        return this.settingsRepository.save(setting);
    }
    async getAll() {
        const settings = await this.settingsRepository.find();
        const result = {};
        settings.forEach((s) => {
            result[s.key] = s.value;
        });
        return result;
    }
    async getApiKeys() {
        const settings = await this.getAll();
        return {
            woocommerce_url: settings.WOOCOMMERCE_URL,
            woocommerce_consumer_key: settings.WOOCOMMERCE_CONSUMER_KEY,
            woocommerce_consumer_secret: settings.WOOCOMMERCE_CONSUMER_SECRET,
            bog_merchant_id: settings.BOG_MERCHANT_ID,
            bog_secret_key: settings.BOG_SECRET_KEY,
            bog_api_url: settings.BOG_API_URL,
            sender_api_key: settings.SENDER_API_KEY,
            sender_api_url: settings.SENDER_API_URL,
        };
    }
    async setApiKeys(keys) {
        const mappings = [
            { key: 'WOOCOMMERCE_URL', value: keys.woocommerce_url },
            { key: 'WOOCOMMERCE_CONSUMER_KEY', value: keys.woocommerce_consumer_key },
            { key: 'WOOCOMMERCE_CONSUMER_SECRET', value: keys.woocommerce_consumer_secret },
            { key: 'BOG_MERCHANT_ID', value: keys.bog_merchant_id },
            { key: 'BOG_SECRET_KEY', value: keys.bog_secret_key },
            { key: 'BOG_API_URL', value: keys.bog_api_url },
            { key: 'SENDER_API_KEY', value: keys.sender_api_key },
            { key: 'SENDER_API_URL', value: keys.sender_api_url },
        ];
        for (const mapping of mappings) {
            if (mapping.value !== undefined) {
                await this.set(mapping.key, mapping.value);
            }
        }
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(settings_entity_1.Setting)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SettingsService);
//# sourceMappingURL=settings.service.js.map