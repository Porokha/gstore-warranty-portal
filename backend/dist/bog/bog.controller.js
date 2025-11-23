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
exports.BogController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const bog_service_1 = require("./bog.service");
const initiate_payment_dto_1 = require("./dto/initiate-payment.dto");
const payments_service_1 = require("../payments/payments.service");
let BogController = class BogController {
    constructor(bogService, paymentsService) {
        this.bogService = bogService;
        this.paymentsService = paymentsService;
    }
    async initiatePayment(paymentId, initiateDto) {
        const payment = await this.paymentsService.findOne(paymentId);
        const customerInfo = {
            first_name: initiateDto.customer_first_name || payment.case_.customer_name,
            last_name: initiateDto.customer_last_name || payment.case_.customer_last_name || '',
            phone: initiateDto.customer_phone || payment.case_.customer_phone,
            email: initiateDto.customer_email || payment.case_.customer_email || undefined,
        };
        const amount = initiateDto.amount || payment.offer_amount || 0;
        const description = initiateDto.description ||
            `Payment for case ${payment.case_.case_number} - ${payment.offer_type}`;
        return this.bogService.initiatePayment(paymentId, amount, description, customerInfo);
    }
    async handleCallback(callbackData) {
        await this.bogService.handleCallback(callbackData);
        return { success: true };
    }
    async checkPaymentStatus(paymentId) {
        return this.bogService.checkPaymentStatus(paymentId);
    }
};
exports.BogController = BogController;
__decorate([
    (0, common_1.Post)('payments/:paymentId/initiate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('paymentId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, initiate_payment_dto_1.InitiatePaymentDto]),
    __metadata("design:returntype", Promise)
], BogController.prototype, "initiatePayment", null);
__decorate([
    (0, common_1.Post)('callback'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BogController.prototype, "handleCallback", null);
__decorate([
    (0, common_1.Get)('payments/:paymentId/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('paymentId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], BogController.prototype, "checkPaymentStatus", null);
exports.BogController = BogController = __decorate([
    (0, common_1.Controller)('bog'),
    __metadata("design:paramtypes", [bog_service_1.BogService,
        payments_service_1.PaymentsService])
], BogController);
//# sourceMappingURL=bog.controller.js.map