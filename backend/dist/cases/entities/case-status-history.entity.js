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
exports.CaseStatusHistory = void 0;
const typeorm_1 = require("typeorm");
const service_case_entity_1 = require("./service-case.entity");
const user_entity_1 = require("../../users/entities/user.entity");
let CaseStatusHistory = class CaseStatusHistory {
};
exports.CaseStatusHistory = CaseStatusHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], CaseStatusHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], CaseStatusHistory.prototype, "case_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], CaseStatusHistory.prototype, "changed_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], CaseStatusHistory.prototype, "previous_status_level", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], CaseStatusHistory.prototype, "new_status_level", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['covered', 'payable', 'returned', 'replaceable'],
        nullable: true,
    }),
    __metadata("design:type", String)
], CaseStatusHistory.prototype, "previous_result", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['covered', 'payable', 'returned', 'replaceable'],
        nullable: true,
    }),
    __metadata("design:type", String)
], CaseStatusHistory.prototype, "new_result", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], CaseStatusHistory.prototype, "note_public", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], CaseStatusHistory.prototype, "note_private", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CaseStatusHistory.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => service_case_entity_1.ServiceCase, (case_) => case_.status_history),
    (0, typeorm_1.JoinColumn)({ name: 'case_id' }),
    __metadata("design:type", service_case_entity_1.ServiceCase)
], CaseStatusHistory.prototype, "case_", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.status_changes),
    (0, typeorm_1.JoinColumn)({ name: 'changed_by' }),
    __metadata("design:type", user_entity_1.User)
], CaseStatusHistory.prototype, "changed_by_user", void 0);
exports.CaseStatusHistory = CaseStatusHistory = __decorate([
    (0, typeorm_1.Entity)('case_status_history')
], CaseStatusHistory);
//# sourceMappingURL=case-status-history.entity.js.map