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
exports.ServiceCase = exports.Priority = exports.ResultType = exports.CaseStatusLevel = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const warranty_entity_1 = require("../../warranties/entities/warranty.entity");
const case_status_history_entity_1 = require("./case-status-history.entity");
const case_payment_entity_1 = require("../../payments/entities/case-payment.entity");
const case_file_entity_1 = require("../../files/entities/case-file.entity");
var CaseStatusLevel;
(function (CaseStatusLevel) {
    CaseStatusLevel[CaseStatusLevel["OPENED"] = 1] = "OPENED";
    CaseStatusLevel[CaseStatusLevel["INVESTIGATING"] = 2] = "INVESTIGATING";
    CaseStatusLevel[CaseStatusLevel["PENDING"] = 3] = "PENDING";
    CaseStatusLevel[CaseStatusLevel["COMPLETED"] = 4] = "COMPLETED";
})(CaseStatusLevel || (exports.CaseStatusLevel = CaseStatusLevel = {}));
var ResultType;
(function (ResultType) {
    ResultType["COVERED"] = "covered";
    ResultType["PAYABLE"] = "payable";
    ResultType["RETURNED"] = "returned";
    ResultType["REPLACEABLE"] = "replaceable";
})(ResultType || (exports.ResultType = ResultType = {}));
var Priority;
(function (Priority) {
    Priority["LOW"] = "low";
    Priority["NORMAL"] = "normal";
    Priority["HIGH"] = "high";
    Priority["CRITICAL"] = "critical";
})(Priority || (exports.Priority = Priority = {}));
let ServiceCase = class ServiceCase {
};
exports.ServiceCase = ServiceCase;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ServiceCase.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], ServiceCase.prototype, "case_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], ServiceCase.prototype, "warranty_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServiceCase.prototype, "sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ServiceCase.prototype, "imei", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServiceCase.prototype, "serial_number", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServiceCase.prototype, "device_type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServiceCase.prototype, "product_title", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServiceCase.prototype, "customer_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ServiceCase.prototype, "customer_last_name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServiceCase.prototype, "customer_phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ServiceCase.prototype, "customer_email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ServiceCase.prototype, "customer_initial_note", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], ServiceCase.prototype, "order_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], ServiceCase.prototype, "product_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], ServiceCase.prototype, "opened_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], ServiceCase.prototype, "closed_at", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], ServiceCase.prototype, "deadline_at", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'int',
        default: CaseStatusLevel.OPENED,
    }),
    __metadata("design:type", Number)
], ServiceCase.prototype, "status_level", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['covered', 'payable', 'returned', 'replaceable'],
        nullable: true,
    }),
    __metadata("design:type", String)
], ServiceCase.prototype, "result_type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['low', 'normal', 'high', 'critical'],
        default: 'normal',
    }),
    __metadata("design:type", String)
], ServiceCase.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)('json', { nullable: true }),
    __metadata("design:type", Array)
], ServiceCase.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], ServiceCase.prototype, "assigned_technician_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ServiceCase.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ServiceCase.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => warranty_entity_1.Warranty, (warranty) => warranty.service_cases),
    (0, typeorm_1.JoinColumn)({ name: 'warranty_id' }),
    __metadata("design:type", warranty_entity_1.Warranty)
], ServiceCase.prototype, "warranty", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.assigned_cases),
    (0, typeorm_1.JoinColumn)({ name: 'assigned_technician_id' }),
    __metadata("design:type", user_entity_1.User)
], ServiceCase.prototype, "assigned_technician", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.created_cases),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], ServiceCase.prototype, "created_by_user", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => case_status_history_entity_1.CaseStatusHistory, (history) => history.case_),
    __metadata("design:type", Array)
], ServiceCase.prototype, "status_history", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => case_payment_entity_1.CasePayment, (payment) => payment.case_),
    __metadata("design:type", Array)
], ServiceCase.prototype, "payments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => case_file_entity_1.CaseFile, (file) => file.case_),
    __metadata("design:type", Array)
], ServiceCase.prototype, "files", void 0);
exports.ServiceCase = ServiceCase = __decorate([
    (0, typeorm_1.Entity)('service_cases')
], ServiceCase);
//# sourceMappingURL=service-case.entity.js.map