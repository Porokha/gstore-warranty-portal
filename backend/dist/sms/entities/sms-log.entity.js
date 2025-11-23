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
exports.SmsLog = exports.SmsStatus = void 0;
const typeorm_1 = require("typeorm");
var SmsStatus;
(function (SmsStatus) {
    SmsStatus["SENT"] = "sent";
    SmsStatus["FAILED"] = "failed";
    SmsStatus["SKIPPED"] = "skipped";
})(SmsStatus || (exports.SmsStatus = SmsStatus = {}));
let SmsLog = class SmsLog {
};
exports.SmsLog = SmsLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SmsLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SmsLog.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SmsLog.prototype, "template_key", void 0);
__decorate([
    (0, typeorm_1.Column)('json', { nullable: true }),
    __metadata("design:type", Object)
], SmsLog.prototype, "payload_json", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['sent', 'failed', 'skipped'],
    }),
    __metadata("design:type", String)
], SmsLog.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], SmsLog.prototype, "api_response", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SmsLog.prototype, "created_at", void 0);
exports.SmsLog = SmsLog = __decorate([
    (0, typeorm_1.Entity)('sms_logs')
], SmsLog);
//# sourceMappingURL=sms-log.entity.js.map