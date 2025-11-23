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
exports.CasesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const cases_service_1 = require("./cases.service");
const create_case_dto_1 = require("./dto/create-case.dto");
const update_case_dto_1 = require("./dto/update-case.dto");
const change_status_dto_1 = require("./dto/change-status.dto");
const service_case_entity_1 = require("./entities/service-case.entity");
let CasesController = class CasesController {
    constructor(casesService) {
        this.casesService = casesService;
    }
    findAll(status, result, priority, device_type, technician_id, tags, search, start_date, end_date) {
        const filters = {};
        if (status !== undefined && status !== null && status !== '') {
            const statusNum = parseInt(status, 10);
            if (!isNaN(statusNum) && statusNum >= 1 && statusNum <= 4) {
                filters.status = statusNum;
            }
        }
        if (result)
            filters.result = result;
        if (priority)
            filters.priority = priority;
        if (device_type)
            filters.device_type = device_type;
        if (technician_id !== undefined && technician_id !== null && technician_id !== '') {
            const techId = parseInt(technician_id, 10);
            if (!isNaN(techId)) {
                filters.technician_id = techId;
            }
        }
        if (tags)
            filters.tags = tags.split(',');
        if (search)
            filters.search = search;
        if (start_date)
            filters.start_date = new Date(start_date);
        if (end_date)
            filters.end_date = new Date(end_date);
        return this.casesService.findAll(filters);
    }
    findOne(id) {
        return this.casesService.findOne(id);
    }
    create(createDto, req) {
        console.log('Received case creation request:', JSON.stringify(createDto, null, 2));
        return this.casesService.create(createDto, req.user.id);
    }
    update(id, updateDto, req) {
        return this.casesService.update(id, updateDto, req.user.id);
    }
    changeStatus(id, changeStatusDto, req) {
        return this.casesService.changeStatus(id, changeStatusDto, req.user.id);
    }
    reopen(id, req) {
        return this.casesService.reopen(id, req.user.id);
    }
    async remove(id, req) {
        return this.casesService.remove(id, req.user.id);
    }
};
exports.CasesController = CasesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('result')),
    __param(2, (0, common_1.Query)('priority')),
    __param(3, (0, common_1.Query)('device_type')),
    __param(4, (0, common_1.Query)('technician_id')),
    __param(5, (0, common_1.Query)('tags')),
    __param(6, (0, common_1.Query)('search')),
    __param(7, (0, common_1.Query)('start_date')),
    __param(8, (0, common_1.Query)('end_date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], CasesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CasesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_case_dto_1.CreateCaseDto, Object]),
    __metadata("design:returntype", void 0)
], CasesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_case_dto_1.UpdateCaseDto, Object]),
    __metadata("design:returntype", void 0)
], CasesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/status'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, change_status_dto_1.ChangeStatusDto, Object]),
    __metadata("design:returntype", void 0)
], CasesController.prototype, "changeStatus", null);
__decorate([
    (0, common_1.Post)(':id/reopen'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], CasesController.prototype, "reopen", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], CasesController.prototype, "remove", null);
exports.CasesController = CasesController = __decorate([
    (0, common_1.Controller)('cases'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [cases_service_1.CasesService])
], CasesController);
//# sourceMappingURL=cases.controller.js.map