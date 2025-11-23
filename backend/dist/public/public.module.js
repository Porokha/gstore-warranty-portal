"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const public_controller_1 = require("./public.controller");
const public_service_1 = require("./public.service");
const warranty_entity_1 = require("../warranties/entities/warranty.entity");
const service_case_entity_1 = require("../cases/entities/service-case.entity");
const case_status_history_entity_1 = require("../cases/entities/case-status-history.entity");
let PublicModule = class PublicModule {
};
exports.PublicModule = PublicModule;
exports.PublicModule = PublicModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([warranty_entity_1.Warranty, service_case_entity_1.ServiceCase, case_status_history_entity_1.CaseStatusHistory]),
        ],
        controllers: [public_controller_1.PublicController],
        providers: [public_service_1.PublicService],
    })
], PublicModule);
//# sourceMappingURL=public.module.js.map