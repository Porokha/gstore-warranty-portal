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
exports.Warranty = exports.CreatedSource = void 0;
const typeorm_1 = require("typeorm");
const service_case_entity_1 = require("../../cases/entities/service-case.entity");
var CreatedSource;
(function (CreatedSource) {
    CreatedSource["AUTO_WOO"] = "auto_woo";
    CreatedSource["MANUAL"] = "manual";
})(CreatedSource || (exports.CreatedSource = CreatedSource = {}));
let Warranty = class Warranty {
};
exports.Warranty = Warranty;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Warranty.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Warranty.prototype, "warranty_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Warranty.prototype, "order_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Warranty.prototype, "product_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Warranty.prototype, "order_line_index", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Warranty.prototype, "sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Warranty.prototype, "imei", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Warranty.prototype, "serial_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'Laptop' }),
    __metadata("design:type", String)
], Warranty.prototype, "device_type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Warranty.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Warranty.prototype, "thumbnail_url", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Warranty.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Warranty.prototype, "customer_name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Warranty.prototype, "customer_last_name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Warranty.prototype, "customer_phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Warranty.prototype, "customer_email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], Warranty.prototype, "purchase_date", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], Warranty.prototype, "warranty_start", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], Warranty.prototype, "warranty_end", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Warranty.prototype, "extended_days", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['auto_woo', 'manual'],
        default: 'manual',
    }),
    __metadata("design:type", String)
], Warranty.prototype, "created_source", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Warranty.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Warranty.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => service_case_entity_1.ServiceCase, (case_) => case_.warranty),
    __metadata("design:type", Array)
], Warranty.prototype, "service_cases", void 0);
exports.Warranty = Warranty = __decorate([
    (0, typeorm_1.Entity)('warranties')
], Warranty);
//# sourceMappingURL=warranty.entity.js.map