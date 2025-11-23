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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const case_payment_entity_1 = require("./entities/case-payment.entity");
const service_case_entity_1 = require("../cases/entities/service-case.entity");
const sms_service_1 = require("../sms/sms.service");
const sms_template_entity_1 = require("../sms/entities/sms-template.entity");
let PaymentsService = class PaymentsService {
    constructor(paymentsRepository, casesRepository, smsService) {
        this.paymentsRepository = paymentsRepository;
        this.casesRepository = casesRepository;
        this.smsService = smsService;
    }
    async generateCode() {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const existing = await this.paymentsRepository.findOne({
            where: { generated_code: code, code_status: case_payment_entity_1.CodeStatus.ACTIVE },
        });
        if (existing) {
            return this.generateCode();
        }
        return code;
    }
    async createOffer(caseId, createOfferDto) {
        const case_ = await this.casesRepository.findOne({
            where: { id: caseId },
            relations: ['payments'],
        });
        if (!case_) {
            throw new common_1.NotFoundException(`Case with ID ${caseId} not found`);
        }
        if (case_.status_level !== service_case_entity_1.CaseStatusLevel.PENDING &&
            case_.status_level !== service_case_entity_1.CaseStatusLevel.COMPLETED) {
            throw new common_1.BadRequestException('Offers can only be created for pending or completed cases');
        }
        const existingOffer = await this.paymentsRepository.findOne({
            where: {
                case_id: caseId,
                offer_type: createOfferDto.offer_type,
            },
        });
        if (existingOffer) {
            throw new common_1.BadRequestException(`An offer of type ${createOfferDto.offer_type} already exists for this case`);
        }
        const payment = this.paymentsRepository.create({
            case_id: caseId,
            offer_type: createOfferDto.offer_type,
            offer_amount: createOfferDto.offer_amount || null,
            payment_method: createOfferDto.payment_method || null,
            payment_status: case_payment_entity_1.PaymentStatus.PENDING,
            estimated_days_after_payment: createOfferDto.estimated_days_after_payment || null,
        });
        const savedPayment = await this.paymentsRepository.save(payment);
        if (createOfferDto.offer_type === 'payable' && case_.customer_phone && createOfferDto.offer_amount) {
            try {
                await this.smsService.sendSms({
                    phone: case_.customer_phone,
                    templateKey: 'sms.offer.payable',
                    language: sms_template_entity_1.Language.KA,
                    variables: {
                        case_number: case_.case_number,
                        amount: createOfferDto.offer_amount,
                        payment_code: savedPayment.generated_code || 'N/A',
                    },
                });
            }
            catch (error) {
                console.error('Failed to send offer SMS:', error);
            }
        }
        return savedPayment;
    }
    async findAllByCase(caseId) {
        const case_ = await this.casesRepository.findOne({
            where: { id: caseId },
        });
        if (!case_) {
            throw new common_1.NotFoundException(`Case with ID ${caseId} not found`);
        }
        return this.paymentsRepository.find({
            where: { case_id: caseId },
            order: { created_at: 'DESC' },
        });
    }
    async findAll(filters) {
        const query = this.paymentsRepository.createQueryBuilder('payment')
            .leftJoinAndSelect('payment.case_', 'case')
            .orderBy('payment.created_at', 'DESC');
        if (filters?.start_date) {
            query.andWhere('payment.created_at >= :start_date', { start_date: filters.start_date });
        }
        if (filters?.end_date) {
            query.andWhere('payment.created_at <= :end_date', { end_date: filters.end_date });
        }
        if (filters?.device_type) {
            query.andWhere('case.device_type = :device_type', { device_type: filters.device_type });
        }
        if (filters?.payment_status) {
            query.andWhere('payment.payment_status = :payment_status', { payment_status: filters.payment_status });
        }
        if (filters?.payment_method) {
            query.andWhere('payment.payment_method = :payment_method', { payment_method: filters.payment_method });
        }
        return query.getMany();
    }
    async findOne(id) {
        const payment = await this.paymentsRepository.findOne({
            where: { id },
            relations: ['case_'],
        });
        if (!payment) {
            throw new common_1.NotFoundException(`Payment with ID ${id} not found`);
        }
        return payment;
    }
    async update(id, updateDto) {
        const payment = await this.findOne(id);
        Object.assign(payment, updateDto);
        return this.paymentsRepository.save(payment);
    }
    async generatePaymentCode(paymentId, generateCodeDto) {
        const payment = await this.findOne(paymentId);
        if (payment.payment_status !== case_payment_entity_1.PaymentStatus.PENDING) {
            throw new common_1.BadRequestException('Code can only be generated for pending payments');
        }
        if (payment.generated_code && payment.code_status === case_payment_entity_1.CodeStatus.ACTIVE) {
            throw new common_1.BadRequestException('An active code already exists for this payment');
        }
        const code = await this.generateCode();
        payment.generated_code = code;
        payment.code_status = case_payment_entity_1.CodeStatus.ACTIVE;
        payment.code_generated_at = new Date();
        payment.estimated_days_after_payment = generateCodeDto.estimated_days_after_payment;
        return this.paymentsRepository.save(payment);
    }
    async verifyCode(verifyCodeDto) {
        const payment = await this.paymentsRepository.findOne({
            where: {
                generated_code: verifyCodeDto.code,
                code_status: case_payment_entity_1.CodeStatus.ACTIVE,
            },
            relations: ['case_'],
        });
        if (!payment) {
            throw new common_1.NotFoundException('Invalid or expired code');
        }
        if (payment.code_status === case_payment_entity_1.CodeStatus.USED) {
            throw new common_1.BadRequestException('This code has already been used');
        }
        payment.code_status = case_payment_entity_1.CodeStatus.USED;
        payment.code_used_at = new Date();
        payment.payment_status = case_payment_entity_1.PaymentStatus.PAID;
        if (payment.case_ && payment.case_.status_level === service_case_entity_1.CaseStatusLevel.PENDING) {
            payment.case_.status_level = service_case_entity_1.CaseStatusLevel.COMPLETED;
            payment.case_.result_type = payment.offer_type;
            await this.casesRepository.save(payment.case_);
        }
        return this.paymentsRepository.save(payment);
    }
    async markAsPaid(paymentId, bogTransactionId) {
        const payment = await this.findOne(paymentId);
        if (payment.payment_status === case_payment_entity_1.PaymentStatus.PAID) {
            throw new common_1.BadRequestException('Payment is already marked as paid');
        }
        payment.payment_status = case_payment_entity_1.PaymentStatus.PAID;
        if (bogTransactionId) {
            payment.bog_transaction_id = bogTransactionId;
        }
        if (payment.generated_code && payment.code_status === case_payment_entity_1.CodeStatus.ACTIVE) {
            payment.code_status = case_payment_entity_1.CodeStatus.USED;
            payment.code_used_at = new Date();
        }
        if (payment.case_ && payment.case_.status_level === service_case_entity_1.CaseStatusLevel.PENDING) {
            payment.case_.status_level = service_case_entity_1.CaseStatusLevel.COMPLETED;
            payment.case_.result_type = payment.offer_type;
            await this.casesRepository.save(payment.case_);
        }
        const savedPayment = await this.paymentsRepository.save(payment);
        if (payment.case_ && payment.case_.customer_phone) {
            try {
                await this.smsService.sendSms({
                    phone: payment.case_.customer_phone,
                    templateKey: 'sms.payment.confirmed',
                    language: sms_template_entity_1.Language.KA,
                    variables: {
                        case_number: payment.case_.case_number,
                        amount: payment.offer_amount || 0,
                        transaction_id: bogTransactionId || 'N/A',
                    },
                });
            }
            catch (error) {
                console.error('Failed to send payment confirmation SMS:', error);
            }
        }
        return savedPayment;
    }
    async markAsFailed(paymentId) {
        const payment = await this.findOne(paymentId);
        payment.payment_status = case_payment_entity_1.PaymentStatus.FAILED;
        return this.paymentsRepository.save(payment);
    }
    async remove(id) {
        const payment = await this.findOne(id);
        if (payment.payment_status !== case_payment_entity_1.PaymentStatus.PENDING) {
            throw new common_1.ForbiddenException('Can only delete pending payments');
        }
        await this.paymentsRepository.remove(payment);
    }
    async getStats(caseId) {
        const queryBuilder = this.paymentsRepository.createQueryBuilder('payment');
        if (caseId) {
            queryBuilder.where('payment.case_id = :caseId', { caseId });
        }
        const total = await queryBuilder.getCount();
        const pending = await queryBuilder
            .clone()
            .andWhere('payment.payment_status = :status', { status: case_payment_entity_1.PaymentStatus.PENDING })
            .getCount();
        const paid = await queryBuilder
            .clone()
            .andWhere('payment.payment_status = :status', { status: case_payment_entity_1.PaymentStatus.PAID })
            .getCount();
        const failed = await queryBuilder
            .clone()
            .andWhere('payment.payment_status = :status', { status: case_payment_entity_1.PaymentStatus.FAILED })
            .getCount();
        const paidPayments = await queryBuilder
            .clone()
            .andWhere('payment.payment_status = :status', { status: case_payment_entity_1.PaymentStatus.PAID })
            .getMany();
        const totalAmount = paidPayments.reduce((sum, payment) => sum + (payment.offer_amount || 0), 0);
        return {
            total,
            pending,
            paid,
            failed,
            totalAmount,
        };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(case_payment_entity_1.CasePayment)),
    __param(1, (0, typeorm_1.InjectRepository)(service_case_entity_1.ServiceCase)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        sms_service_1.SmsService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map