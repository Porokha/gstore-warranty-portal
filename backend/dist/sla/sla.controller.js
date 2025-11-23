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
exports.SlaController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const sla_service_1 = require("./sla.service");
let SlaController = class SlaController {
    constructor(slaService) {
        this.slaService = slaService;
    }
    getMetrics() {
        return this.slaService.getMetrics();
    }
    getCasesCloseToDeadline(days) {
        return this.slaService.getCasesCloseToDeadline(days ? parseInt(days.toString()) : 1);
    }
    getDueCases() {
        return this.slaService.getDueCases();
    }
    getStalledCases(days) {
        return this.slaService.getStalledCases(days ? parseInt(days.toString()) : 3);
    }
    checkAlerts() {
        return this.slaService.checkSLAAlerts();
    }
};
exports.SlaController = SlaController;
__decorate([
    (0, common_1.Get)('metrics'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SlaController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)('cases/close-to-deadline'),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], SlaController.prototype, "getCasesCloseToDeadline", null);
__decorate([
    (0, common_1.Get)('cases/due'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SlaController.prototype, "getDueCases", null);
__decorate([
    (0, common_1.Get)('cases/stalled'),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], SlaController.prototype, "getStalledCases", null);
__decorate([
    (0, common_1.Post)('check-alerts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SlaController.prototype, "checkAlerts", null);
exports.SlaController = SlaController = __decorate([
    (0, common_1.Controller)('sla'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [sla_service_1.SlaService])
], SlaController);
//# sourceMappingURL=sla.controller.js.map