"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlaModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const schedule_1 = require("@nestjs/schedule");
const sla_service_1 = require("./sla.service");
const sla_controller_1 = require("./sla.controller");
const sla_scheduler_1 = require("./sla.scheduler");
const service_case_entity_1 = require("../cases/entities/service-case.entity");
const sms_module_1 = require("../sms/sms.module");
let SlaModule = class SlaModule {
};
exports.SlaModule = SlaModule;
exports.SlaModule = SlaModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([service_case_entity_1.ServiceCase]),
            sms_module_1.SmsModule,
            schedule_1.ScheduleModule.forRoot(),
        ],
        controllers: [sla_controller_1.SlaController],
        providers: [sla_service_1.SlaService, sla_scheduler_1.SlaScheduler],
        exports: [sla_service_1.SlaService],
    })
], SlaModule);
//# sourceMappingURL=sla.module.js.map