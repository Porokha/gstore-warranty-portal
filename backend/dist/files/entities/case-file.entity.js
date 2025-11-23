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
exports.CaseFile = exports.FileType = void 0;
const typeorm_1 = require("typeorm");
const service_case_entity_1 = require("../../cases/entities/service-case.entity");
const user_entity_1 = require("../../users/entities/user.entity");
var FileType;
(function (FileType) {
    FileType["IMAGE"] = "image";
    FileType["VIDEO"] = "video";
    FileType["PDF"] = "pdf";
    FileType["OTHER"] = "other";
})(FileType || (exports.FileType = FileType = {}));
let CaseFile = class CaseFile {
};
exports.CaseFile = CaseFile;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], CaseFile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], CaseFile.prototype, "case_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CaseFile.prototype, "file_url", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['image', 'video', 'pdf', 'other'],
    }),
    __metadata("design:type", String)
], CaseFile.prototype, "file_type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], CaseFile.prototype, "uploaded_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CaseFile.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => service_case_entity_1.ServiceCase, (case_) => case_.files),
    (0, typeorm_1.JoinColumn)({ name: 'case_id' }),
    __metadata("design:type", service_case_entity_1.ServiceCase)
], CaseFile.prototype, "case_", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'uploaded_by' }),
    __metadata("design:type", user_entity_1.User)
], CaseFile.prototype, "uploaded_by_user", void 0);
exports.CaseFile = CaseFile = __decorate([
    (0, typeorm_1.Entity)('case_files')
], CaseFile);
//# sourceMappingURL=case-file.entity.js.map