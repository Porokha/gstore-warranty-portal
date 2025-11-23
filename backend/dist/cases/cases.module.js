"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CasesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const cases_service_1 = require("./cases.service");
const cases_controller_1 = require("./cases.controller");
const service_case_entity_1 = require("./entities/service-case.entity");
const case_status_history_entity_1 = require("./entities/case-status-history.entity");
const users_module_1 = require("../users/users.module");
const sms_module_1 = require("../sms/sms.module");
const audit_module_1 = require("../audit/audit.module");
let CasesModule = class CasesModule {
};
exports.CasesModule = CasesModule;
exports.CasesModule = CasesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([service_case_entity_1.ServiceCase, case_status_history_entity_1.CaseStatusHistory]),
            users_module_1.UsersModule,
            sms_module_1.SmsModule,
            audit_module_1.AuditModule,
        ],
        controllers: [cases_controller_1.CasesController],
        providers: [cases_service_1.CasesService],
        exports: [cases_service_1.CasesService],
    })
], CasesModule);
//# sourceMappingURL=cases.module.js.map