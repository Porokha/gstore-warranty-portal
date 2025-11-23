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
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const payments_service_1 = require("./payments.service");
const create_offer_dto_1 = require("./dto/create-offer.dto");
const update_payment_dto_1 = require("./dto/update-payment.dto");
const generate_code_dto_1 = require("./dto/generate-code.dto");
const verify_code_dto_1 = require("./dto/verify-code.dto");
let PaymentsController = class PaymentsController {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    createOffer(caseId, createOfferDto) {
        return this.paymentsService.createOffer(caseId, createOfferDto);
    }
    findAllByCase(caseId) {
        return this.paymentsService.findAllByCase(caseId);
    }
    findOne(id) {
        return this.paymentsService.findOne(id);
    }
    update(id, updateDto) {
        return this.paymentsService.update(id, updateDto);
    }
    generateCode(id, generateCodeDto) {
        return this.paymentsService.generatePaymentCode(id, generateCodeDto);
    }
    markAsPaid(id, bogTransactionId) {
        return this.paymentsService.markAsPaid(id, bogTransactionId);
    }
    markAsFailed(id) {
        return this.paymentsService.markAsFailed(id);
    }
    remove(id) {
        return this.paymentsService.remove(id);
    }
    findAll(startDate, endDate, deviceType, paymentStatus, paymentMethod) {
        const filters = {};
        if (startDate) {
            filters.start_date = new Date(startDate);
        }
        if (endDate) {
            filters.end_date = new Date(endDate);
        }
        if (deviceType) {
            filters.device_type = deviceType;
        }
        if (paymentStatus) {
            filters.payment_status = paymentStatus;
        }
        if (paymentMethod) {
            filters.payment_method = paymentMethod;
        }
        return this.paymentsService.findAll(filters);
    }
    getStats(caseId) {
        return this.paymentsService.getStats(caseId ? parseInt(caseId.toString()) : undefined);
    }
    verifyCode(verifyCodeDto) {
        return this.paymentsService.verifyCode(verifyCodeDto);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('cases/:caseId/offers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('caseId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_offer_dto_1.CreateOfferDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "createOffer", null);
__decorate([
    (0, common_1.Get)('cases/:caseId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('caseId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "findAllByCase", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_payment_dto_1.UpdatePaymentDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/generate-code'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, generate_code_dto_1.GenerateCodeDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "generateCode", null);
__decorate([
    (0, common_1.Post)(':id/mark-paid'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('bog_transaction_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "markAsPaid", null);
__decorate([
    (0, common_1.Post)(':id/mark-failed'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "markAsFailed", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Query)('start_date')),
    __param(1, (0, common_1.Query)('end_date')),
    __param(2, (0, common_1.Query)('device_type')),
    __param(3, (0, common_1.Query)('payment_status')),
    __param(4, (0, common_1.Query)('payment_method')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats/summary'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Query)('case_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Post)('verify-code'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_code_dto_1.VerifyCodeDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "verifyCode", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map