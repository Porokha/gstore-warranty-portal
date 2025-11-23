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
var SlaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlaService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const service_case_entity_1 = require("../cases/entities/service-case.entity");
const sms_service_1 = require("../sms/sms.service");
const sms_template_entity_1 = require("../sms/entities/sms-template.entity");
let SlaService = SlaService_1 = class SlaService {
    constructor(casesRepository, smsService) {
        this.casesRepository = casesRepository;
        this.smsService = smsService;
        this.logger = new common_1.Logger(SlaService_1.name);
    }
    async getMetrics() {
        const now = new Date();
        const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        const openCases = await this.casesRepository.find({
            where: [
                { status_level: service_case_entity_1.CaseStatusLevel.OPENED },
                { status_level: service_case_entity_1.CaseStatusLevel.INVESTIGATING },
                { status_level: service_case_entity_1.CaseStatusLevel.PENDING },
            ],
        });
        const casesCloseToDeadline = openCases.filter((case_) => new Date(case_.deadline_at) <= oneDayFromNow &&
            new Date(case_.deadline_at) >= now).length;
        const casesDue = openCases.filter((case_) => new Date(case_.deadline_at) < now).length;
        const casesStalled = openCases.filter((case_) => {
            const lastUpdate = case_.updated_at || case_.opened_at;
            return new Date(lastUpdate) < threeDaysAgo;
        }).length;
        const completedCases = await this.casesRepository.find({
            where: { status_level: service_case_entity_1.CaseStatusLevel.COMPLETED },
            select: ['opened_at', 'closed_at'],
        });
        let avgDaysToCompletion = 0;
        if (completedCases.length > 0) {
            const totalDays = completedCases
                .filter((c) => c.closed_at)
                .reduce((sum, c) => {
                const days = Math.ceil((new Date(c.closed_at).getTime() - new Date(c.opened_at).getTime()) /
                    (1000 * 60 * 60 * 24));
                return sum + days;
            }, 0);
            avgDaysToCompletion = totalDays / completedCases.filter((c) => c.closed_at).length;
        }
        const onTimeCases = completedCases.filter((c) => {
            if (!c.closed_at)
                return false;
            return new Date(c.closed_at) <= new Date(c.opened_at);
        }).length;
        const onTimeCompletionRate = completedCases.length > 0
            ? (onTimeCases / completedCases.filter((c) => c.closed_at).length) * 100
            : 0;
        return {
            totalOpenCases: openCases.length,
            casesCloseToDeadline: casesCloseToDeadline,
            casesDue: casesDue,
            casesStalled: casesStalled,
            avgDaysToCompletion: Math.round(avgDaysToCompletion * 10) / 10,
            onTimeCompletionRate: Math.round(onTimeCompletionRate * 10) / 10,
        };
    }
    async checkSLAAlerts() {
        const now = new Date();
        const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        const openCases = await this.casesRepository.find({
            where: [
                { status_level: service_case_entity_1.CaseStatusLevel.OPENED },
                { status_level: service_case_entity_1.CaseStatusLevel.INVESTIGATING },
                { status_level: service_case_entity_1.CaseStatusLevel.PENDING },
            ],
        });
        const dueCases = openCases.filter((case_) => new Date(case_.deadline_at) < now);
        for (const case_ of dueCases) {
            await this.sendSLAAlert(case_, 'sla_due');
        }
        const closeToDeadlineCases = openCases.filter((case_) => new Date(case_.deadline_at) <= oneDayFromNow &&
            new Date(case_.deadline_at) >= now);
        for (const case_ of closeToDeadlineCases) {
            await this.sendSLAAlert(case_, 'sla_deadline_1day');
        }
        const stalledCases = openCases.filter((case_) => {
            const lastUpdate = case_.updated_at || case_.opened_at;
            return new Date(lastUpdate) < threeDaysAgo;
        });
        for (const case_ of stalledCases) {
            await this.sendSLAAlert(case_, 'sla_stalled');
        }
    }
    async sendSLAAlert(case_, alertType) {
        if (!case_.customer_phone) {
            return;
        }
        try {
            const daysOverdue = Math.ceil((new Date().getTime() - new Date(case_.deadline_at).getTime()) /
                (1000 * 60 * 60 * 24));
            const daysUntilDeadline = Math.ceil((new Date(case_.deadline_at).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24));
            const variables = {
                case_number: case_.case_number,
                product_title: case_.product_title,
                deadline: new Date(case_.deadline_at).toLocaleDateString('ka-GE'),
            };
            if (alertType === 'sla_due') {
                variables.days_overdue = daysOverdue;
            }
            else if (alertType === 'sla_deadline_1day') {
                variables.days_until_deadline = daysUntilDeadline;
            }
            await this.smsService.sendSms({
                phone: case_.customer_phone,
                templateKey: `sms.${alertType}`,
                language: sms_template_entity_1.Language.KA,
                variables,
            });
        }
        catch (error) {
            this.logger.error(`Failed to send SLA alert for case ${case_.id}:`, error.message);
        }
    }
    async getCasesCloseToDeadline(days = 1) {
        const now = new Date();
        const deadline = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        return this.casesRepository.find({
            where: [
                { status_level: service_case_entity_1.CaseStatusLevel.OPENED },
                { status_level: service_case_entity_1.CaseStatusLevel.INVESTIGATING },
                { status_level: service_case_entity_1.CaseStatusLevel.PENDING },
            ],
            relations: ['assigned_technician'],
        }).then((cases) => cases.filter((case_) => new Date(case_.deadline_at) <= deadline &&
            new Date(case_.deadline_at) >= now));
    }
    async getDueCases() {
        const now = new Date();
        return this.casesRepository.find({
            where: [
                { status_level: service_case_entity_1.CaseStatusLevel.OPENED },
                { status_level: service_case_entity_1.CaseStatusLevel.INVESTIGATING },
                { status_level: service_case_entity_1.CaseStatusLevel.PENDING },
            ],
            relations: ['assigned_technician'],
        }).then((cases) => cases.filter((case_) => new Date(case_.deadline_at) < now));
    }
    async getStalledCases(days = 3) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        return this.casesRepository.find({
            where: [
                { status_level: service_case_entity_1.CaseStatusLevel.OPENED },
                { status_level: service_case_entity_1.CaseStatusLevel.INVESTIGATING },
                { status_level: service_case_entity_1.CaseStatusLevel.PENDING },
            ],
            relations: ['assigned_technician'],
        }).then((cases) => cases.filter((case_) => {
            const lastUpdate = case_.updated_at || case_.opened_at;
            return new Date(lastUpdate) < cutoffDate;
        }));
    }
};
exports.SlaService = SlaService;
exports.SlaService = SlaService = SlaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(service_case_entity_1.ServiceCase)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        sms_service_1.SmsService])
], SlaService);
//# sourceMappingURL=sla.service.js.map