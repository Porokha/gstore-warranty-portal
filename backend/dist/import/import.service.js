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
exports.ImportService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const fs = require("fs");
const csv_parser_1 = require("csv-parser");
const service_case_entity_1 = require("../cases/entities/service-case.entity");
const warranty_entity_1 = require("../warranties/entities/warranty.entity");
const cases_service_1 = require("../cases/cases.service");
const warranties_service_1 = require("../warranties/warranties.service");
let ImportService = class ImportService {
    constructor(casesRepository, warrantiesRepository, casesService, warrantiesService) {
        this.casesRepository = casesRepository;
        this.warrantiesRepository = warrantiesRepository;
        this.casesService = casesService;
        this.warrantiesService = warrantiesService;
    }
    async importCasesFromCSV(filePath, userId) {
        const results = [];
        const errors = [];
        return new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe((0, csv_parser_1.default)())
                .on('data', async (row) => {
                try {
                    const caseData = {
                        warranty_id: row.warranty_id ? parseInt(row.warranty_id) : undefined,
                        sku: row.sku || '',
                        imei: row.imei || undefined,
                        serial_number: row.serial_number || '',
                        device_type: row.device_type || 'Laptop',
                        product_title: row.product_title || '',
                        customer_name: row.customer_name || '',
                        customer_last_name: row.customer_last_name || undefined,
                        customer_phone: row.customer_phone || '',
                        customer_email: row.customer_email || undefined,
                        customer_initial_note: row.customer_initial_note || undefined,
                        order_id: row.order_id ? parseInt(row.order_id) : undefined,
                        product_id: row.product_id ? parseInt(row.product_id) : undefined,
                        assigned_technician_id: row.assigned_technician_id
                            ? parseInt(row.assigned_technician_id)
                            : undefined,
                        priority: row.priority || service_case_entity_1.Priority.NORMAL,
                        tags: row.tags ? row.tags.split(',').map((t) => t.trim()) : undefined,
                        deadline_days: row.deadline_days ? parseInt(row.deadline_days) : 14,
                    };
                    if (!caseData.sku || !caseData.serial_number || !caseData.product_title || !caseData.customer_name || !caseData.customer_phone) {
                        errors.push({ row, error: 'Missing required fields' });
                        return;
                    }
                    const created = await this.casesService.create(caseData, userId);
                    results.push({ row, case: created });
                }
                catch (error) {
                    errors.push({ row, error: error.message });
                }
            })
                .on('end', () => {
                fs.unlinkSync(filePath);
                resolve({
                    success: true,
                    imported: results.length,
                    errors: errors.length,
                    details: {
                        successful: results,
                        failed: errors,
                    },
                });
            })
                .on('error', (error) => {
                reject(error);
            });
        });
    }
    async importWarrantiesFromCSV(filePath, userId) {
        const results = [];
        const errors = [];
        return new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe((0, csv_parser_1.default)())
                .on('data', async (row) => {
                try {
                    const warrantyData = {
                        title: row.title || '',
                        sku: row.sku || '',
                        imei: row.imei || undefined,
                        serial_number: row.serial_number || '',
                        device_type: row.device_type || 'Laptop',
                        customer_name: row.customer_name || '',
                        customer_last_name: row.customer_last_name || undefined,
                        customer_phone: row.customer_phone || '',
                        customer_email: row.customer_email || undefined,
                        purchase_date: row.purchase_date ? new Date(row.purchase_date).toISOString() : new Date().toISOString(),
                        warranty_start: row.warranty_start ? new Date(row.warranty_start).toISOString() : new Date().toISOString(),
                        warranty_end: row.warranty_end ? new Date(row.warranty_end).toISOString() : undefined,
                        warranty_duration_days: row.warranty_duration_days
                            ? parseInt(row.warranty_duration_days)
                            : 365,
                        order_id: row.order_id ? parseInt(row.order_id) : undefined,
                        product_id: row.product_id ? parseInt(row.product_id) : undefined,
                        created_source: row.created_source === 'woocommerce' ? warranty_entity_1.CreatedSource.AUTO_WOO : warranty_entity_1.CreatedSource.MANUAL,
                    };
                    if (!warrantyData.title || !warrantyData.sku || !warrantyData.serial_number || !warrantyData.customer_name || !warrantyData.customer_phone) {
                        errors.push({ row, error: 'Missing required fields' });
                        return;
                    }
                    if (!warrantyData.warranty_end) {
                        const start = new Date(warrantyData.warranty_start || warrantyData.purchase_date);
                        const endDate = new Date(start);
                        endDate.setDate(endDate.getDate() + (parseInt(row.warranty_duration_days) || 365));
                        warrantyData.warranty_end = endDate.toISOString();
                    }
                    const created = await this.warrantiesService.create(warrantyData);
                    results.push({ row, warranty: created });
                }
                catch (error) {
                    errors.push({ row, error: error.message });
                }
            })
                .on('end', () => {
                fs.unlinkSync(filePath);
                resolve({
                    success: true,
                    imported: results.length,
                    errors: errors.length,
                    details: {
                        successful: results,
                        failed: errors,
                    },
                });
            })
                .on('error', (error) => {
                reject(error);
            });
        });
    }
    generateCasesExampleCSV() {
        const headers = [
            'sku',
            'serial_number',
            'imei',
            'device_type',
            'product_title',
            'customer_name',
            'customer_last_name',
            'customer_phone',
            'customer_email',
            'customer_initial_note',
            'warranty_id',
            'order_id',
            'product_id',
            'assigned_technician_id',
            'priority',
            'tags',
            'deadline_days',
        ];
        const exampleRow = [
            'SKU-001',
            'SN123456789',
            'IMEI123456789012345',
            'Phone',
            'iPhone 15 Pro',
            'John',
            'Doe',
            '+995555123456',
            'john.doe@example.com',
            'Screen not working',
            '',
            '12345',
            '67890',
            '',
            'normal',
            'urgent,repair',
            '14',
        ];
        return [headers.join(','), exampleRow.join(',')].join('\n');
    }
    generateWarrantiesExampleCSV() {
        const headers = [
            'title',
            'sku',
            'serial_number',
            'imei',
            'device_type',
            'customer_name',
            'customer_last_name',
            'customer_phone',
            'customer_email',
            'purchase_date',
            'warranty_start',
            'warranty_end',
            'warranty_duration_days',
            'order_id',
            'product_id',
            'created_source',
        ];
        const exampleRow = [
            'iPhone 15 Pro',
            'SKU-001',
            'SN123456789',
            'IMEI123456789012345',
            'Phone',
            'John',
            'Doe',
            '+995555123456',
            'john.doe@example.com',
            '2024-01-15',
            '2024-01-15',
            '2025-01-15',
            '365',
            '12345',
            '67890',
            'manual',
        ];
        return [headers.join(','), exampleRow.join(',')].join('\n');
    }
};
exports.ImportService = ImportService;
exports.ImportService = ImportService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(service_case_entity_1.ServiceCase)),
    __param(1, (0, typeorm_1.InjectRepository)(warranty_entity_1.Warranty)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        cases_service_1.CasesService,
        warranties_service_1.WarrantiesService])
], ImportService);
//# sourceMappingURL=import.service.js.map