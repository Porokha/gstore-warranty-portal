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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const import_service_1 = require("./import.service");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let ImportController = class ImportController {
    constructor(importService) {
        this.importService = importService;
    }
    async importCases(file, user) {
        if (!file) {
            throw new Error('No file uploaded');
        }
        return this.importService.importCasesFromCSV(file.path, user.id);
    }
    async importWarranties(file, user) {
        if (!file) {
            throw new Error('No file uploaded');
        }
        return this.importService.importWarrantiesFromCSV(file.path, user.id);
    }
    async downloadCasesExample(res) {
        const csv = this.importService.generateCasesExampleCSV();
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=cases-example.csv');
        res.send(csv);
    }
    async downloadWarrantiesExample(res) {
        const csv = this.importService.generateWarrantiesExampleCSV();
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=warranties-example.csv');
        res.send(csv);
    }
};
exports.ImportController = ImportController;
__decorate([
    (0, common_1.Post)('cases/csv'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: 'uploads/imports',
            filename: (req, file, cb) => {
                const timestamp = Date.now();
                cb(null, `cases_${timestamp}_${file.originalname}`);
            },
        }),
        limits: {
            fileSize: 10 * 1024 * 1024,
        },
        fileFilter: (req, file, cb) => {
            if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
                cb(null, true);
            }
            else {
                cb(new Error('Only CSV files are allowed'), false);
            }
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ImportController.prototype, "importCases", null);
__decorate([
    (0, common_1.Post)('warranties/csv'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: 'uploads/imports',
            filename: (req, file, cb) => {
                const timestamp = Date.now();
                cb(null, `warranties_${timestamp}_${file.originalname}`);
            },
        }),
        limits: {
            fileSize: 10 * 1024 * 1024,
        },
        fileFilter: (req, file, cb) => {
            if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
                cb(null, true);
            }
            else {
                cb(new Error('Only CSV files are allowed'), false);
            }
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ImportController.prototype, "importWarranties", null);
__decorate([
    (0, common_1.Get)('cases/csv/example'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ImportController.prototype, "downloadCasesExample", null);
__decorate([
    (0, common_1.Get)('warranties/csv/example'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ImportController.prototype, "downloadWarrantiesExample", null);
exports.ImportController = ImportController = __decorate([
    (0, common_1.Controller)('import'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [import_service_1.ImportService])
], ImportController);
//# sourceMappingURL=import.controller.js.map