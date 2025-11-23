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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const service_case_entity_1 = require("../cases/entities/service-case.entity");
const warranty_entity_1 = require("../warranties/entities/warranty.entity");
const case_payment_entity_1 = require("../payments/entities/case-payment.entity");
let DashboardService = class DashboardService {
    constructor(casesRepository, warrantiesRepository, paymentsRepository) {
        this.casesRepository = casesRepository;
        this.warrantiesRepository = warrantiesRepository;
        this.paymentsRepository = paymentsRepository;
    }
    async getDashboardStats(timeFilter) {
        const now = new Date();
        const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        const openCases = await this.casesRepository.count({
            where: { status_level: (0, typeorm_2.LessThan)(service_case_entity_1.CaseStatusLevel.COMPLETED) },
        });
        const closeToDeadline = await this.casesRepository
            .createQueryBuilder('case')
            .where('case.status_level < :completed', { completed: service_case_entity_1.CaseStatusLevel.COMPLETED })
            .andWhere('case.deadline_at <= :in48Hours', { in48Hours })
            .andWhere('case.deadline_at > :now', { now })
            .getCount();
        const dueCases = await this.casesRepository.count({
            where: {
                status_level: (0, typeorm_2.LessThan)(service_case_entity_1.CaseStatusLevel.COMPLETED),
                deadline_at: (0, typeorm_2.LessThan)(now),
            },
        });
        let closedCasesQuery = this.casesRepository
            .createQueryBuilder('case')
            .where('case.status_level = :completed', { completed: service_case_entity_1.CaseStatusLevel.COMPLETED })
            .andWhere('case.closed_at IS NOT NULL');
        if (timeFilter?.start) {
            closedCasesQuery = closedCasesQuery.andWhere('case.closed_at > :start', { start: timeFilter.start });
        }
        if (timeFilter?.end) {
            closedCasesQuery = closedCasesQuery.andWhere('case.closed_at <= :end', { end: timeFilter.end });
        }
        const closedCases = await closedCasesQuery.getCount();
        const activeWarrantiesWhere = {
            warranty_end: (0, typeorm_2.MoreThan)(now),
        };
        if (timeFilter?.start) {
            activeWarrantiesWhere.purchase_date = (0, typeorm_2.MoreThan)(timeFilter.start);
        }
        if (timeFilter?.end) {
            activeWarrantiesWhere.purchase_date = (0, typeorm_2.LessThanOrEqual)(timeFilter.end);
        }
        const activeWarranties = await this.warrantiesRepository.count({
            where: activeWarrantiesWhere,
        });
        const expiredWarrantiesWhere = {
            warranty_end: (0, typeorm_2.LessThan)(now),
        };
        if (timeFilter?.start) {
            expiredWarrantiesWhere.warranty_end = (0, typeorm_2.MoreThan)(timeFilter.start);
        }
        if (timeFilter?.end) {
            expiredWarrantiesWhere.warranty_end = (0, typeorm_2.LessThanOrEqual)(timeFilter.end);
        }
        const expiredWarranties = await this.warrantiesRepository.count({
            where: expiredWarrantiesWhere,
        });
        let completedCasesQuery = this.casesRepository
            .createQueryBuilder('case')
            .where('case.status_level = :completed', { completed: service_case_entity_1.CaseStatusLevel.COMPLETED })
            .andWhere('case.closed_at IS NOT NULL');
        if (timeFilter?.start) {
            completedCasesQuery = completedCasesQuery.andWhere('case.closed_at > :start', { start: timeFilter.start });
        }
        if (timeFilter?.end) {
            completedCasesQuery = completedCasesQuery.andWhere('case.closed_at <= :end', { end: timeFilter.end });
        }
        const completedCases = await completedCasesQuery
            .getMany();
        const avgCompletionTime = completedCases.length > 0
            ? completedCases
                .filter((case_) => case_.closed_at != null)
                .reduce((sum, case_) => {
                const diff = case_.closed_at.getTime() - case_.opened_at.getTime();
                return sum + diff / (1000 * 60 * 60 * 24);
            }, 0) / completedCases.filter((case_) => case_.closed_at != null).length || 0
            : 0;
        let onTimeQuery = this.casesRepository
            .createQueryBuilder('case')
            .where('case.status_level = :completed', { completed: service_case_entity_1.CaseStatusLevel.COMPLETED })
            .andWhere('case.closed_at IS NOT NULL')
            .andWhere('case.closed_at <= case.deadline_at');
        if (timeFilter?.start) {
            onTimeQuery = onTimeQuery.andWhere('case.closed_at > :start', { start: timeFilter.start });
        }
        if (timeFilter?.end) {
            onTimeQuery = onTimeQuery.andWhere('case.closed_at <= :end', { end: timeFilter.end });
        }
        const onTimeCases = await onTimeQuery.getCount();
        const paymentsWhere = {
            payment_status: case_payment_entity_1.PaymentStatus.PAID,
        };
        if (timeFilter?.start) {
            paymentsWhere.created_at = (0, typeorm_2.MoreThan)(timeFilter.start);
        }
        if (timeFilter?.end) {
            paymentsWhere.created_at = (0, typeorm_2.LessThanOrEqual)(timeFilter.end);
        }
        const payments = await this.paymentsRepository.find({
            where: paymentsWhere,
            select: ['offer_amount'],
        });
        const totalPayments = payments.length;
        const totalMoneyIn = payments.reduce((sum, p) => sum + Number(p.offer_amount || 0), 0);
        return {
            realTime: {
                openCases,
                closeToDeadline,
                dueCases,
            },
            timeFiltered: {
                closedCases,
                activeWarranties,
                expiredWarranties,
                avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
                avgCompletionByDeviceType: {},
                onTimeCases,
                totalPayments,
                totalMoneyIn,
                totalMoneyLost: 0,
            },
        };
    }
    async getAvgCompletionByDeviceType(deviceType, timeFilter) {
        let completedCasesQuery = this.casesRepository
            .createQueryBuilder('case')
            .where('case.status_level = :completed', { completed: service_case_entity_1.CaseStatusLevel.COMPLETED })
            .andWhere('case.device_type = :deviceType', { deviceType })
            .andWhere('case.closed_at IS NOT NULL');
        if (timeFilter?.start) {
            completedCasesQuery = completedCasesQuery.andWhere('case.closed_at > :start', { start: timeFilter.start });
        }
        if (timeFilter?.end) {
            completedCasesQuery = completedCasesQuery.andWhere('case.closed_at <= :end', { end: timeFilter.end });
        }
        const completedCases = await completedCasesQuery
            .getMany();
        if (completedCases.length === 0) {
            return 0;
        }
        const avg = completedCases.reduce((sum, case_) => {
            const diff = case_.closed_at.getTime() - case_.opened_at.getTime();
            return sum + diff / (1000 * 60 * 60 * 24);
        }, 0) / completedCases.length;
        return Math.round(avg * 10) / 10;
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(service_case_entity_1.ServiceCase)),
    __param(1, (0, typeorm_1.InjectRepository)(warranty_entity_1.Warranty)),
    __param(2, (0, typeorm_1.InjectRepository)(case_payment_entity_1.CasePayment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map