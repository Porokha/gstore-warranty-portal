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
exports.User = exports.LanguagePreference = exports.UserRole = void 0;
const typeorm_1 = require("typeorm");
const service_case_entity_1 = require("../../cases/entities/service-case.entity");
const case_status_history_entity_1 = require("../../cases/entities/case-status-history.entity");
const audit_log_entity_1 = require("../../audit/entities/audit-log.entity");
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["TECHNICIAN"] = "technician";
})(UserRole || (exports.UserRole = UserRole = {}));
var LanguagePreference;
(function (LanguagePreference) {
    LanguagePreference["EN"] = "en";
    LanguagePreference["KA"] = "ka";
})(LanguagePreference || (exports.LanguagePreference = LanguagePreference = {}));
let User = class User {
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "last_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "password_hash", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['admin', 'technician'],
        default: 'technician',
    }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['en', 'ka'],
        default: 'en',
    }),
    __metadata("design:type", String)
], User.prototype, "language_pref", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => service_case_entity_1.ServiceCase, (case_) => case_.assigned_technician),
    __metadata("design:type", Array)
], User.prototype, "assigned_cases", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => service_case_entity_1.ServiceCase, (case_) => case_.created_by_user),
    __metadata("design:type", Array)
], User.prototype, "created_cases", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => case_status_history_entity_1.CaseStatusHistory, (history) => history.changed_by_user),
    __metadata("design:type", Array)
], User.prototype, "status_changes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => audit_log_entity_1.AuditLog, (log) => log.user),
    __metadata("design:type", Array)
], User.prototype, "audit_logs", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
//# sourceMappingURL=user.entity.js.map