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
exports.StatisticsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const statistics_service_1 = require("./statistics.service");
let StatisticsController = class StatisticsController {
    constructor(statisticsService) {
        this.statisticsService = statisticsService;
    }
    async getTechnicianStats(technicianId, startDate, endDate, req) {
        if (req.user.role === user_entity_1.UserRole.TECHNICIAN) {
            return this.statisticsService.getTechnicianStats(req.user.id, startDate, endDate);
        }
        const techId = technicianId ? parseInt(technicianId, 10) : undefined;
        return this.statisticsService.getTechnicianStats(techId, startDate, endDate);
    }
    async getAllTechniciansStats(startDate, endDate) {
        return this.statisticsService.getAllTechniciansStats(startDate, endDate);
    }
    async exportTechnicianStats(technicianId, startDate, endDate, req, res) {
        const stats = req.user.role === user_entity_1.UserRole.TECHNICIAN
            ? await this.statisticsService.getTechnicianStats(req.user.id, startDate, endDate)
            : await this.statisticsService.getTechnicianStats(technicianId ? parseInt(technicianId, 10) : undefined, startDate, endDate);
        const excelBuffer = await this.statisticsService.exportToExcel(stats);
        res.send(excelBuffer);
    }
    async exportAllTechniciansStats(startDate, endDate, res) {
        const stats = await this.statisticsService.getAllTechniciansStats(startDate, endDate);
        const excelBuffer = await this.statisticsService.exportAllToExcel(stats);
        res.send(excelBuffer);
    }
};
exports.StatisticsController = StatisticsController;
__decorate([
    (0, common_1.Get)('technicians'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.TECHNICIAN),
    __param(0, (0, common_1.Query)('technician_id')),
    __param(1, (0, common_1.Query)('start_date')),
    __param(2, (0, common_1.Query)('end_date')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], StatisticsController.prototype, "getTechnicianStats", null);
__decorate([
    (0, common_1.Get)('technicians/all'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Query)('start_date')),
    __param(1, (0, common_1.Query)('end_date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StatisticsController.prototype, "getAllTechniciansStats", null);
__decorate([
    (0, common_1.Get)('technicians/export'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.TECHNICIAN),
    (0, common_1.Header)('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
    (0, common_1.Header)('Content-Disposition', 'attachment; filename=technician-statistics.xlsx'),
    __param(0, (0, common_1.Query)('technician_id')),
    __param(1, (0, common_1.Query)('start_date')),
    __param(2, (0, common_1.Query)('end_date')),
    __param(3, (0, common_1.Request)()),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], StatisticsController.prototype, "exportTechnicianStats", null);
__decorate([
    (0, common_1.Get)('technicians/all/export'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, common_1.Header)('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
    (0, common_1.Header)('Content-Disposition', 'attachment; filename=all-technicians-statistics.xlsx'),
    __param(0, (0, common_1.Query)('start_date')),
    __param(1, (0, common_1.Query)('end_date')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], StatisticsController.prototype, "exportAllTechniciansStats", null);
exports.StatisticsController = StatisticsController = __decorate([
    (0, common_1.Controller)('statistics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [statistics_service_1.StatisticsService])
], StatisticsController);
//# sourceMappingURL=statistics.controller.js.map