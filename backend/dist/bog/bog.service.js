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
var BogService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BogService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = require("axios");
const crypto = require("crypto");
const case_payment_entity_1 = require("../payments/entities/case-payment.entity");
const payments_service_1 = require("../payments/payments.service");
let BogService = BogService_1 = class BogService {
    constructor(configService, paymentsRepository, paymentsService) {
        this.configService = configService;
        this.paymentsRepository = paymentsRepository;
        this.paymentsService = paymentsService;
        this.logger = new common_1.Logger(BogService_1.name);
        this.apiUrl = this.configService.get('BOG_API_URL') || 'https://api.bog.ge';
        this.merchantId = this.configService.get('BOG_MERCHANT_ID');
        this.secretKey = this.configService.get('BOG_SECRET_KEY');
        this.callbackUrl = this.configService.get('BOG_CALLBACK_URL') ||
            `${this.configService.get('PORTAL_URL')}/api/bog/callback`;
        if (!this.merchantId || !this.secretKey) {
            this.logger.warn('BOG payment gateway credentials not configured');
            return;
        }
        this.api = axios_1.default.create({
            baseURL: this.apiUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'Merchant-Id': this.merchantId,
            },
        });
    }
    generateSignature(data) {
        const sortedKeys = Object.keys(data).sort();
        const message = sortedKeys
            .map((key) => `${key}=${data[key]}`)
            .join('&');
        return crypto
            .createHmac('sha256', this.secretKey)
            .update(message)
            .digest('hex');
    }
    verifySignature(data) {
        if (!data.signature) {
            return false;
        }
        const { signature, ...dataToVerify } = data;
        const calculatedSignature = this.generateSignature(dataToVerify);
        return calculatedSignature === signature;
    }
    async initiatePayment(paymentId, amount, description, customerInfo) {
        const payment = await this.paymentsRepository.findOne({
            where: { id: paymentId },
            relations: ['case_'],
        });
        if (!payment) {
            throw new common_1.BadRequestException(`Payment with ID ${paymentId} not found`);
        }
        if (payment.payment_status !== case_payment_entity_1.PaymentStatus.PENDING) {
            throw new common_1.BadRequestException('Can only initiate payment for pending payments');
        }
        const orderId = `PAY-${paymentId}-${Date.now()}`;
        const paymentRequest = {
            amount: amount,
            currency: 'GEL',
            order_id: orderId,
            description: description,
            callback_url: this.callbackUrl,
            success_url: `${this.configService.get('PORTAL_URL')}/payment/success?payment_id=${paymentId}`,
            failure_url: `${this.configService.get('PORTAL_URL')}/payment/failure?payment_id=${paymentId}`,
            customer: {
                first_name: customerInfo.first_name,
                last_name: customerInfo.last_name,
                phone: customerInfo.phone,
                email: customerInfo.email,
            },
        };
        const signature = this.generateSignature(paymentRequest);
        paymentRequest['signature'] = signature;
        try {
            const response = await this.api.post('/v1/payments', paymentRequest);
            payment.bog_transaction_id = response.data.payment_id || orderId;
            await this.paymentsRepository.save(payment);
            this.logger.log(`Initiated BOG payment for payment ID ${paymentId}, order ID: ${orderId}`);
            return {
                order_id: orderId,
                payment_id: response.data.payment_id || orderId,
                payment_url: response.data.payment_url,
                status: response.data.status || 'pending',
            };
        }
        catch (error) {
            this.logger.error(`Failed to initiate BOG payment:`, error.message);
            throw new common_1.BadRequestException('Failed to initiate payment with BOG gateway');
        }
    }
    async handleCallback(callbackData) {
        if (!this.verifySignature(callbackData)) {
            this.logger.error('Invalid signature in BOG callback');
            throw new common_1.BadRequestException('Invalid signature');
        }
        const orderIdMatch = callbackData.order_id.match(/PAY-(\d+)-/);
        if (!orderIdMatch) {
            throw new common_1.BadRequestException('Invalid order ID format');
        }
        const paymentId = parseInt(orderIdMatch[1], 10);
        const payment = await this.paymentsRepository.findOne({
            where: { id: paymentId },
            relations: ['case_'],
        });
        if (!payment) {
            this.logger.error(`Payment ${paymentId} not found for BOG callback`);
            throw new common_1.BadRequestException('Payment not found');
        }
        if (callbackData.status === 'success' || callbackData.status === 'completed') {
            await this.paymentsService.markAsPaid(paymentId, callbackData.transaction_id);
            this.logger.log(`Payment ${paymentId} marked as paid via BOG callback`);
        }
        else if (callbackData.status === 'failed' || callbackData.status === 'error') {
            await this.paymentsService.markAsFailed(paymentId);
            this.logger.log(`Payment ${paymentId} marked as failed via BOG callback`);
        }
        else {
            this.logger.warn(`Unknown payment status from BOG: ${callbackData.status}`);
        }
    }
    async checkPaymentStatus(paymentId) {
        const payment = await this.paymentsRepository.findOne({
            where: { id: paymentId },
        });
        if (!payment || !payment.bog_transaction_id) {
            throw new common_1.BadRequestException('Payment or BOG transaction ID not found');
        }
        try {
            const response = await this.api.get(`/v1/payments/${payment.bog_transaction_id}`, {
                headers: {
                    'Merchant-Id': this.merchantId,
                },
            });
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to check BOG payment status:`, error.message);
            throw new common_1.BadRequestException('Failed to check payment status');
        }
    }
};
exports.BogService = BogService;
exports.BogService = BogService = BogService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(case_payment_entity_1.CasePayment)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository,
        payments_service_1.PaymentsService])
], BogService);
//# sourceMappingURL=bog.service.js.map