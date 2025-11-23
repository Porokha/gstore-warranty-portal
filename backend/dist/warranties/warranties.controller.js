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
exports.WarrantiesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const warranties_service_1 = require("./warranties.service");
const create_warranty_dto_1 = require("./dto/create-warranty.dto");
const update_warranty_dto_1 = require("./dto/update-warranty.dto");
const filter_warranty_dto_1 = require("./dto/filter-warranty.dto");
let WarrantiesController = class WarrantiesController {
    constructor(warrantiesService) {
        this.warrantiesService = warrantiesService;
    }
    create(createDto) {
        return this.warrantiesService.create(createDto);
    }
    findAll(filters) {
        return this.warrantiesService.findAll(filters);
    }
    getStats(startDate, endDate) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return this.warrantiesService.getStats(start, end);
    }
    findByWarrantyId(warrantyId) {
        return this.warrantiesService.findByWarrantyId(warrantyId);
    }
    findOne(id) {
        return this.warrantiesService.findOne(id);
    }
    update(id, updateDto) {
        return this.warrantiesService.update(id, updateDto);
    }
    extendWarranty(id, days) {
        return this.warrantiesService.extendWarranty(id, days);
    }
    remove(id, req) {
        return this.warrantiesService.remove(id, req.user.id);
    }
};
exports.WarrantiesController = WarrantiesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_warranty_dto_1.CreateWarrantyDto]),
    __metadata("design:returntype", void 0)
], WarrantiesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filter_warranty_dto_1.FilterWarrantyDto]),
    __metadata("design:returntype", void 0)
], WarrantiesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Query)('start')),
    __param(1, (0, common_1.Query)('end')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], WarrantiesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('warranty-id/:warrantyId'),
    __param(0, (0, common_1.Param)('warrantyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WarrantiesController.prototype, "findByWarrantyId", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], WarrantiesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_warranty_dto_1.UpdateWarrantyDto]),
    __metadata("design:returntype", void 0)
], WarrantiesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/extend'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('days', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], WarrantiesController.prototype, "extendWarranty", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], WarrantiesController.prototype, "remove", null);
exports.WarrantiesController = WarrantiesController = __decorate([
    (0, common_1.Controller)('warranties'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [warranties_service_1.WarrantiesService])
], WarrantiesController);
//# sourceMappingURL=warranties.controller.js.map