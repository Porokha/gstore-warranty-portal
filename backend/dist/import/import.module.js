"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const import_service_1 = require("./import.service");
const import_controller_1 = require("./import.controller");
const service_case_entity_1 = require("../cases/entities/service-case.entity");
const warranty_entity_1 = require("../warranties/entities/warranty.entity");
const cases_module_1 = require("../cases/cases.module");
const warranties_module_1 = require("../warranties/warranties.module");
let ImportModule = class ImportModule {
};
exports.ImportModule = ImportModule;
exports.ImportModule = ImportModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([service_case_entity_1.ServiceCase, warranty_entity_1.Warranty]),
            cases_module_1.CasesModule,
            warranties_module_1.WarrantiesModule,
        ],
        controllers: [import_controller_1.ImportController],
        providers: [import_service_1.ImportService],
        exports: [import_service_1.ImportService],
    })
], ImportModule);
//# sourceMappingURL=import.module.js.map