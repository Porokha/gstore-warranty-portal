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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CasePayment = exports.CodeStatus = exports.PaymentStatus = exports.PaymentMethod = void 0;
const typeorm_1 = require("typeorm");
const service_case_entity_1 = require("../../cases/entities/service-case.entity");
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["ONSITE"] = "onsite";
    PaymentMethod["ONLINE"] = "online";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["FAILED"] = "failed";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var CodeStatus;
(function (CodeStatus) {
    CodeStatus["ACTIVE"] = "active";
    CodeStatus["USED"] = "used";
})(CodeStatus || (exports.CodeStatus = CodeStatus = {}));
let CasePayment = class CasePayment {
};
exports.CasePayment = CasePayment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], CasePayment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], CasePayment.prototype, "case_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['covered', 'payable', 'returned', 'replaceable'],
    }),
    __metadata("design:type", String)
], CasePayment.prototype, "offer_type", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], CasePayment.prototype, "offer_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['onsite', 'online'],
        nullable: true,
    }),
    __metadata("design:type", String)
], CasePayment.prototype, "payment_method", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['pending', 'paid', 'failed'],
        default: 'pending',
    }),
    __metadata("design:type", String)
], CasePayment.prototype, "payment_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CasePayment.prototype, "bog_transaction_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], CasePayment.prototype, "estimated_days_after_payment", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CasePayment.prototype, "generated_code", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['active', 'used'],
        nullable: true,
    }),
    __metadata("design:type", String)
], CasePayment.prototype, "code_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], CasePayment.prototype, "code_generated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], CasePayment.prototype, "code_used_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CasePayment.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], CasePayment.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => service_case_entity_1.ServiceCase, (case_) => case_.payments),
    (0, typeorm_1.JoinColumn)({ name: 'case_id' }),
    __metadata("design:type", service_case_entity_1.ServiceCase)
], CasePayment.prototype, "case_", void 0);
exports.CasePayment = CasePayment = __decorate([
    (0, typeorm_1.Entity)('case_payments')
], CasePayment);
//# sourceMappingURL=case-payment.entity.js.map