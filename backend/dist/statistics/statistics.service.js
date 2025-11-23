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
exports.StatisticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ExcelJS = require("exceljs");
const service_case_entity_1 = require("../cases/entities/service-case.entity");
const user_entity_1 = require("../users/entities/user.entity");
const case_payment_entity_1 = require("../payments/entities/case-payment.entity");
let StatisticsService = class StatisticsService {
    constructor(casesRepository, usersRepository, paymentsRepository) {
        this.casesRepository = casesRepository;
        this.usersRepository = usersRepository;
        this.paymentsRepository = paymentsRepository;
    }
    async getTechnicianStats(technicianId, startDate, endDate) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        const whereClause = {};
        if (technicianId) {
            whereClause.assigned_technician_id = technicianId;
        }
        if (start || end) {
            whereClause.opened_at = start && end
                ? (0, typeorm_2.Between)(start, end)
                : start
                    ? (0, typeorm_2.MoreThan)(start)
                    : (0, typeorm_2.LessThan)(end);
        }
        const totalCases = await this.casesRepository.count({ where: whereClause });
        const runningCases = await this.casesRepository.count({
            where: {
                ...whereClause,
                status_level: (0, typeorm_2.LessThan)(service_case_entity_1.CaseStatusLevel.COMPLETED),
            },
        });
        const completedCases = await this.casesRepository.count({
            where: {
                ...whereClause,
                status_level: service_case_entity_1.CaseStatusLevel.COMPLETED,
            },
        });
        const completedCasesWithDates = await this.casesRepository.find({
            where: {
                ...whereClause,
                status_level: service_case_entity_1.CaseStatusLevel.COMPLETED,
                closed_at: (0, typeorm_2.MoreThan)(new Date(0)),
            },
        });
        let avgCompletionTime = 0;
        if (completedCasesWithDates.length > 0) {
            const totalDays = completedCasesWithDates.reduce((sum, case_) => {
                const days = Math.ceil((case_.closed_at.getTime() - case_.opened_at.getTime()) / (1000 * 60 * 60 * 24));
                return sum + days;
            }, 0);
            avgCompletionTime = Math.round(totalDays / completedCasesWithDates.length);
        }
        const onTimeCases = completedCasesWithDates.filter((case_) => case_.closed_at <= case_.deadline_at).length;
        const casesByStatus = {
            opened: await this.casesRepository.count({
                where: { ...whereClause, status_level: service_case_entity_1.CaseStatusLevel.OPENED },
            }),
            investigating: await this.casesRepository.count({
                where: { ...whereClause, status_level: service_case_entity_1.CaseStatusLevel.INVESTIGATING },
            }),
            pending: await this.casesRepository.count({
                where: { ...whereClause, status_level: service_case_entity_1.CaseStatusLevel.PENDING },
            }),
            completed: completedCases,
        };
        const casesByPriority = {
            low: await this.casesRepository.count({
                where: { ...whereClause, priority: 'low' },
            }),
            normal: await this.casesRepository.count({
                where: { ...whereClause, priority: 'normal' },
            }),
            high: await this.casesRepository.count({
                where: { ...whereClause, priority: 'high' },
            }),
            critical: await this.casesRepository.count({
                where: { ...whereClause, priority: 'critical' },
            }),
        };
        let totalPayments = 0;
        let paidPayments = 0;
        let totalPaidAmount = 0;
        if (technicianId) {
            const caseIds = await this.casesRepository.find({
                where: { assigned_technician_id: technicianId },
                select: ['id'],
            });
            if (caseIds.length > 0) {
                const ids = caseIds.map(c => c.id);
                totalPayments = await this.paymentsRepository
                    .createQueryBuilder('payment')
                    .where('payment.case_id IN (:...ids)', { ids })
                    .getCount();
                paidPayments = await this.paymentsRepository
                    .createQueryBuilder('payment')
                    .where('payment.case_id IN (:...ids)', { ids })
                    .andWhere('payment.payment_status = :status', { status: case_payment_entity_1.PaymentStatus.PAID })
                    .getCount();
                const paidResult = await this.paymentsRepository
                    .createQueryBuilder('payment')
                    .where('payment.case_id IN (:...ids)', { ids })
                    .andWhere('payment.payment_status = :status', { status: case_payment_entity_1.PaymentStatus.PAID })
                    .select('SUM(payment.offer_amount)', 'total')
                    .getRawOne();
                totalPaidAmount = parseFloat(paidResult?.total || '0');
            }
        }
        if (!technicianId) {
            const paidResult = await this.paymentsRepository
                .createQueryBuilder('payment')
                .where('payment.payment_status = :status', { status: case_payment_entity_1.PaymentStatus.PAID })
                .select('SUM(payment.offer_amount)', 'total')
                .getRawOne();
            totalPaidAmount = parseFloat(paidResult?.total || '0');
        }
        return {
            technicianId,
            period: { start, end },
            totalCases,
            runningCases,
            completedCases,
            avgCompletionTime,
            onTimeCases,
            onTimeRate: completedCases > 0 ? ((onTimeCases / completedCases) * 100).toFixed(1) : '0',
            casesByStatus,
            casesByPriority,
            totalPayments,
            paidPayments,
            totalPaidAmount,
        };
    }
    async getAllTechniciansStats(startDate, endDate) {
        const technicians = await this.usersRepository.find({
            where: { role: user_entity_1.UserRole.TECHNICIAN },
        });
        const stats = await Promise.all(technicians.map((tech) => this.getTechnicianStats(tech.id, startDate, endDate).then((stat) => ({
            technician: {
                id: tech.id,
                name: tech.name,
                last_name: tech.last_name,
                username: tech.username,
            },
            ...stat,
        }))));
        return stats;
    }
    async exportToExcel(stats) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Technician Statistics');
        worksheet.columns = [
            { header: 'Metric', key: 'metric', width: 30 },
            { header: 'Value', key: 'value', width: 20 },
        ];
        worksheet.addRow({ metric: 'Total Cases', value: stats.totalCases });
        worksheet.addRow({ metric: 'Running Cases', value: stats.runningCases });
        worksheet.addRow({ metric: 'Completed Cases', value: stats.completedCases });
        worksheet.addRow({ metric: 'Average Completion Time (days)', value: stats.avgCompletionTime });
        worksheet.addRow({ metric: 'On-time Cases', value: stats.onTimeCases });
        worksheet.addRow({ metric: 'On-time Rate (%)', value: stats.onTimeRate });
        worksheet.addRow({});
        worksheet.addRow({ metric: 'Cases by Status', value: '' });
        worksheet.addRow({ metric: '  - Opened', value: stats.casesByStatus.opened });
        worksheet.addRow({ metric: '  - Investigating', value: stats.casesByStatus.investigating });
        worksheet.addRow({ metric: '  - Pending', value: stats.casesByStatus.pending });
        worksheet.addRow({ metric: '  - Completed', value: stats.casesByStatus.completed });
        worksheet.addRow({});
        worksheet.addRow({ metric: 'Cases by Priority', value: '' });
        worksheet.addRow({ metric: '  - Low', value: stats.casesByPriority.low });
        worksheet.addRow({ metric: '  - Normal', value: stats.casesByPriority.normal });
        worksheet.addRow({ metric: '  - High', value: stats.casesByPriority.high });
        worksheet.addRow({ metric: '  - Critical', value: stats.casesByPriority.critical });
        worksheet.addRow({});
        worksheet.addRow({ metric: 'Payment Statistics', value: '' });
        worksheet.addRow({ metric: 'Total Payments', value: stats.totalPayments });
        worksheet.addRow({ metric: 'Paid Payments', value: stats.paidPayments });
        worksheet.addRow({ metric: 'Total Paid Amount (₾)', value: stats.totalPaidAmount });
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
    async exportAllToExcel(stats) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('All Technicians Statistics');
        worksheet.columns = [
            { header: 'Technician', key: 'technician', width: 25 },
            { header: 'Total Cases', key: 'totalCases', width: 15 },
            { header: 'Running', key: 'running', width: 15 },
            { header: 'Completed', key: 'completed', width: 15 },
            { header: 'Avg Completion (days)', key: 'avgCompletion', width: 20 },
            { header: 'On-time Rate (%)', key: 'onTimeRate', width: 18 },
            { header: 'Total Paid (₾)', key: 'totalPaid', width: 15 },
        ];
        stats.forEach((stat) => {
            worksheet.addRow({
                technician: `${stat.technician.name} ${stat.technician.last_name}`,
                totalCases: stat.totalCases,
                running: stat.runningCases,
                completed: stat.completedCases,
                avgCompletion: stat.avgCompletionTime,
                onTimeRate: stat.onTimeRate,
                totalPaid: stat.totalPaidAmount,
            });
        });
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
};
exports.StatisticsService = StatisticsService;
exports.StatisticsService = StatisticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(service_case_entity_1.ServiceCase)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(case_payment_entity_1.CasePayment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], StatisticsService);
//# sourceMappingURL=statistics.service.js.map