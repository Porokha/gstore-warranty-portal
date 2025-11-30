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
var ImportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const fs = require("fs");
const service_case_entity_1 = require("../cases/entities/service-case.entity");
const warranty_entity_1 = require("../warranties/entities/warranty.entity");
const cases_service_1 = require("../cases/cases.service");
const warranties_service_1 = require("../warranties/warranties.service");
let ImportService = ImportService_1 = class ImportService {
    constructor(casesRepository, warrantiesRepository, casesService, warrantiesService) {
        this.casesRepository = casesRepository;
        this.warrantiesRepository = warrantiesRepository;
        this.casesService = casesService;
        this.warrantiesService = warrantiesService;
        this.logger = new common_1.Logger(ImportService_1.name);
    }
    async importCasesFromCSV(filePath, userId) {
        const results = [];
        const errors = [];
        const skipped = [];
        const csvParser = require('csv-parser');
        return new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csvParser())
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
                    const existingCase = await this.casesRepository.findOne({
                        where: [
                            { serial_number: caseData.serial_number, order_id: caseData.order_id || null },
                            ...(caseData.order_id ? [{ order_id: caseData.order_id }] : []),
                        ],
                    });
                    if (existingCase) {
                        skipped.push({ row, reason: 'Duplicate case found' });
                        return;
                    }
                    const created = await this.casesService.create(caseData, userId);
                    results.push({ row, case: created });
                }
                catch (error) {
                    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
                        skipped.push({ row, reason: error.message });
                    }
                    else {
                        errors.push({ row, error: error.message });
                    }
                }
            })
                .on('end', () => {
                fs.unlinkSync(filePath);
                resolve({
                    success: true,
                    imported: results.length,
                    skipped: skipped.length,
                    errors: errors.length,
                    details: {
                        successful: results,
                        skipped,
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
        const skipped = [];
        const rows = [];
        if (!fs.existsSync(filePath)) {
            this.logger.error(`File not found: ${filePath}`);
            throw new common_1.BadRequestException(`File not found: ${filePath}`);
        }
        const csvParser = require('csv-parser');
        return new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csvParser())
                .on('data', (row) => {
                rows.push(row);
            })
                .on('end', async () => {
                this.logger.log(`Processing ${rows.length} warranty rows from CSV`);
                if (rows.length > 0) {
                    this.logger.log(`First row sample (keys): ${Object.keys(rows[0]).join(', ')}`);
                    this.logger.log(`First row data: ${JSON.stringify(rows[0]).substring(0, 500)}`);
                }
                for (const row of rows) {
                    try {
                        const warrantyData = {
                            title: row.title || '',
                            sku: row.sku || '',
                            imei: row.imei || undefined,
                            serial_number: row.serial_number || '',
                            device_type: row.device_type || 'Laptop',
                            customer_name: row.customer_name || '',
                            customer_last_name: row.customer_last_name || '',
                            customer_phone: row.customer_phone || '',
                            customer_email: row.customer_email || undefined,
                            price: row.price ? parseFloat(row.price) : 0,
                            thumbnail_url: row.thumbnail_url || undefined,
                            brand: row.brand || undefined,
                            model: row.model || undefined,
                            condition: row.condition || undefined,
                            personal_identification_number: row.personal_identification_number || row.pn || undefined,
                            admin_notes: row.admin_notes || undefined,
                            extended_days: row.extended_days ? parseInt(row.extended_days) : 0,
                            order_id: row.order_id ? parseInt(row.order_id) : undefined,
                            product_id: row.product_id ? parseInt(row.product_id) : undefined,
                            order_line_index: row.order_line_index ? parseInt(row.order_line_index) : undefined,
                            created_source: row.created_source === 'woocommerce' || row.created_source === 'auto_woo' ? warranty_entity_1.CreatedSource.AUTO_WOO : warranty_entity_1.CreatedSource.MANUAL,
                        };
                        try {
                            warrantyData.purchase_date = row.purchase_date
                                ? new Date(row.purchase_date).toISOString()
                                : new Date().toISOString();
                            warrantyData.warranty_start = row.warranty_start
                                ? new Date(row.warranty_start).toISOString()
                                : warrantyData.purchase_date;
                            if (row.warranty_end) {
                                warrantyData.warranty_end = new Date(row.warranty_end).toISOString();
                            }
                            else {
                                const start = new Date(warrantyData.warranty_start || warrantyData.purchase_date);
                                const durationDays = row.warranty_duration_days ? parseInt(row.warranty_duration_days) : 365;
                                const endDate = new Date(start);
                                endDate.setDate(endDate.getDate() + durationDays);
                                warrantyData.warranty_end = endDate.toISOString();
                            }
                        }
                        catch (dateError) {
                            const errorMsg = `Invalid date format: ${dateError.message}`;
                            if (errors.length < 3) {
                                this.logger.error(`Date parsing error (row ${errors.length + 1}): ${errorMsg}`);
                                this.logger.error(`Row data: ${JSON.stringify(row).substring(0, 300)}`);
                            }
                            errors.push({ row, error: errorMsg });
                            continue;
                        }
                        if (!warrantyData.title || !warrantyData.sku || !warrantyData.serial_number || !warrantyData.customer_name || !warrantyData.customer_phone) {
                            const errorMsg = 'Missing required fields (title, sku, serial_number, customer_name, customer_phone)';
                            if (errors.length < 3) {
                                this.logger.error(`Validation error (row ${errors.length + 1}): ${errorMsg}`);
                                this.logger.error(`Row data: title=${row.title}, sku=${row.sku}, serial_number=${row.serial_number}, customer_name=${row.customer_name}, customer_phone=${row.customer_phone}`);
                            }
                            errors.push({ row, error: errorMsg });
                            continue;
                        }
                        if (isNaN(new Date(warrantyData.purchase_date).getTime()) ||
                            isNaN(new Date(warrantyData.warranty_start).getTime()) ||
                            isNaN(new Date(warrantyData.warranty_end).getTime())) {
                            const errorMsg = 'Invalid date values';
                            if (errors.length < 3) {
                                this.logger.error(`Date validation error (row ${errors.length + 1}): ${errorMsg}`);
                                this.logger.error(`Dates: purchase_date=${warrantyData.purchase_date}, warranty_start=${warrantyData.warranty_start}, warranty_end=${warrantyData.warranty_end}`);
                            }
                            errors.push({ row, error: errorMsg });
                            continue;
                        }
                        const existingWarranty = await this.warrantiesRepository.findOne({
                            where: [
                                { serial_number: warrantyData.serial_number, order_id: warrantyData.order_id || null },
                                ...(warrantyData.order_id ? [{ order_id: warrantyData.order_id }] : []),
                            ],
                        });
                        if (existingWarranty) {
                            skipped.push({ row, reason: 'Duplicate warranty found' });
                            continue;
                        }
                        if (results.length === 0 && errors.length === 0) {
                            this.logger.log(`Sample warranty data being created:`, JSON.stringify(warrantyData, null, 2).substring(0, 500));
                        }
                        const created = await this.warrantiesService.create(warrantyData);
                        results.push({ row, warranty: created });
                    }
                    catch (error) {
                        const errorMessage = error.message || 'Unknown error';
                        const errorStack = error.stack || '';
                        if (errors.length < 3) {
                            this.logger.error(`Error processing warranty row ${errors.length + 1}:`, errorMessage);
                            this.logger.error(`Row data:`, JSON.stringify(row).substring(0, 300));
                            if (errorStack) {
                                this.logger.error(`Stack:`, errorStack.substring(0, 500));
                            }
                        }
                        if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
                            skipped.push({ row, reason: errorMessage });
                        }
                        else {
                            let fullError = errorMessage;
                            if (error.response?.message) {
                                if (Array.isArray(error.response.message)) {
                                    fullError = error.response.message.join('; ');
                                }
                                else {
                                    fullError = error.response.message;
                                }
                            }
                            errors.push({ row, error: fullError });
                        }
                    }
                }
                this.logger.log(`Import complete: ${results.length} imported, ${skipped.length} skipped, ${errors.length} errors`);
                if (errors.length > 0) {
                    this.logger.error(`First 5 errors:`);
                    errors.slice(0, 5).forEach((err, idx) => {
                        this.logger.error(`Error ${idx + 1}: ${err.error}`);
                        this.logger.error(`Row data: ${JSON.stringify(err.row).substring(0, 200)}...`);
                    });
                    const errorTypes = {};
                    errors.forEach(err => {
                        const errorMsg = err.error || 'Unknown error';
                        const errorType = errorMsg.split(':')[0].split('(')[0].trim();
                        errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
                    });
                    this.logger.error(`Error summary: ${JSON.stringify(errorTypes)}`);
                }
                try {
                    fs.unlinkSync(filePath);
                }
                catch (unlinkError) {
                    console.error('Failed to delete temp file:', unlinkError);
                }
                resolve({
                    success: true,
                    imported: results.length,
                    skipped: skipped.length,
                    errors: errors.length,
                    details: {
                        successful: results,
                        skipped,
                        failed: errors,
                    },
                });
            })
                .on('error', (error) => {
                this.logger.error('Error reading CSV file:', error);
                reject(error);
            });
        }).catch((error) => {
            this.logger.error('Error in importWarrantiesFromCSV:', error);
            throw error;
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
            'order_line_index',
            'created_source',
            'price',
            'thumbnail_url',
            'brand',
            'model',
            'condition',
            'personal_identification_number',
            'admin_notes',
            'extended_days',
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
            '0',
            'manual',
            '999.99',
            'https://example.com/image.jpg',
            'Apple',
            'iPhone 15 Pro',
            'New',
            'PN-12345',
            'Internal note for admin',
            '0',
        ];
        return [headers.join(','), exampleRow.join(',')].join('\n');
    }
};
exports.ImportService = ImportService;
exports.ImportService = ImportService = ImportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(service_case_entity_1.ServiceCase)),
    __param(1, (0, typeorm_1.InjectRepository)(warranty_entity_1.Warranty)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        cases_service_1.CasesService,
        warranties_service_1.WarrantiesService])
], ImportService);
//# sourceMappingURL=import.service.js.map