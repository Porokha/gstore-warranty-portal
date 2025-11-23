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
exports.WooCommerceController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const woocommerce_service_1 = require("./woocommerce.service");
let WooCommerceController = class WooCommerceController {
    constructor(wooCommerceService) {
        this.wooCommerceService = wooCommerceService;
    }
    async handleOrderWebhook(body) {
        await this.wooCommerceService.processOrderWebhook(body.id, body.status);
        return { success: true };
    }
    async syncOrder(orderId) {
        const warranties = await this.wooCommerceService.syncOrder(orderId);
        return {
            success: true,
            warranties,
            count: warranties.length,
        };
    }
    async createWarranty(orderId, lineItemIndex) {
        const index = lineItemIndex ? parseInt(lineItemIndex.toString()) : 0;
        const warranty = await this.wooCommerceService.createWarrantyFromOrder(orderId, index);
        return warranty;
    }
    async getOrder(orderId) {
        return this.wooCommerceService.getOrder(orderId);
    }
    async getProduct(productId) {
        return this.wooCommerceService.getProduct(productId);
    }
    async syncOrders(body) {
        const statuses = body.statuses || ['completed'];
        const limit = body.limit || 100;
        const result = await this.wooCommerceService.syncOrdersByStatus(statuses, limit);
        return result;
    }
};
exports.WooCommerceController = WooCommerceController;
__decorate([
    (0, common_1.Post)('webhook/order'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WooCommerceController.prototype, "handleOrderWebhook", null);
__decorate([
    (0, common_1.Post)('sync/order/:orderId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('orderId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], WooCommerceController.prototype, "syncOrder", null);
__decorate([
    (0, common_1.Post)('create-warranty/:orderId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('orderId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('lineItemIndex')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], WooCommerceController.prototype, "createWarranty", null);
__decorate([
    (0, common_1.Get)('order/:orderId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('orderId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], WooCommerceController.prototype, "getOrder", null);
__decorate([
    (0, common_1.Get)('product/:productId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('productId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], WooCommerceController.prototype, "getProduct", null);
__decorate([
    (0, common_1.Post)('sync/orders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WooCommerceController.prototype, "syncOrders", null);
exports.WooCommerceController = WooCommerceController = __decorate([
    (0, common_1.Controller)('woocommerce'),
    __metadata("design:paramtypes", [woocommerce_service_1.WooCommerceService])
], WooCommerceController);
//# sourceMappingURL=woocommerce.controller.js.map