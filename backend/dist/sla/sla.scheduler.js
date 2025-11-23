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
var SlaScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlaScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const sla_service_1 = require("./sla.service");
let SlaScheduler = SlaScheduler_1 = class SlaScheduler {
    constructor(slaService) {
        this.slaService = slaService;
        this.logger = new common_1.Logger(SlaScheduler_1.name);
    }
    async handleSLAAlerts() {
        this.logger.log('Running SLA alert check...');
        try {
            await this.slaService.checkSLAAlerts();
            this.logger.log('SLA alert check completed');
        }
        catch (error) {
            this.logger.error('Error during SLA alert check:', error.message);
        }
    }
};
exports.SlaScheduler = SlaScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SlaScheduler.prototype, "handleSLAAlerts", null);
exports.SlaScheduler = SlaScheduler = SlaScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sla_service_1.SlaService])
], SlaScheduler);
//# sourceMappingURL=sla.scheduler.js.map