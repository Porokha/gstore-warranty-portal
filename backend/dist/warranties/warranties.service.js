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
exports.WarrantiesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const warranty_entity_1 = require("./entities/warranty.entity");
const audit_service_1 = require("../audit/audit.service");
let WarrantiesService = class WarrantiesService {
    constructor(warrantiesRepository, auditService) {
        this.warrantiesRepository = warrantiesRepository;
        this.auditService = auditService;
    }
    async generateWarrantyId(createdSource = warranty_entity_1.CreatedSource.MANUAL, orderId, productId) {
        const prefix = createdSource === warranty_entity_1.CreatedSource.AUTO_WOO ? 'WP' : 'MN';
        if (createdSource === warranty_entity_1.CreatedSource.AUTO_WOO && orderId && productId) {
            return `${prefix}-${orderId}-${productId}`;
        }
        const lastWarranty = await this.warrantiesRepository.findOne({
            where: { created_source: createdSource },
            order: { id: 'DESC' },
        });
        let nextNumber = 1;
        if (lastWarranty && lastWarranty.warranty_id) {
            const match = lastWarranty.warranty_id.match(new RegExp(`${prefix}-(\\d+)`));
            if (match) {
                nextNumber = parseInt(match[1], 10) + 1;
            }
        }
        return `${prefix}-${nextNumber.toString().padStart(4, '0')}-${Date.now().toString().slice(-4)}`;
    }
    async create(createDto) {
        const warrantyId = await this.generateWarrantyId(createDto.created_source || warranty_entity_1.CreatedSource.MANUAL);
        const warranty = this.warrantiesRepository.create({
            ...createDto,
            warranty_id: warrantyId,
            purchase_date: new Date(createDto.purchase_date),
            warranty_start: new Date(createDto.warranty_start),
            warranty_end: new Date(createDto.warranty_end),
            created_source: createDto.created_source || warranty_entity_1.CreatedSource.MANUAL,
            extended_days: createDto.extended_days || 0,
        });
        return this.warrantiesRepository.save(warranty);
    }
    async findAll(filters) {
        const queryBuilder = this.warrantiesRepository.createQueryBuilder('warranty');
        if (filters) {
            if (filters.search) {
                queryBuilder.andWhere('(warranty.warranty_id LIKE :search OR warranty.sku LIKE :search OR warranty.serial_number LIKE :search OR warranty.title LIKE :search OR warranty.customer_name LIKE :search OR warranty.customer_phone LIKE :search)', { search: `%${filters.search}%` });
            }
            if (filters.sku) {
                queryBuilder.andWhere('warranty.sku = :sku', { sku: filters.sku });
            }
            if (filters.serial_number) {
                queryBuilder.andWhere('warranty.serial_number = :serial_number', {
                    serial_number: filters.serial_number,
                });
            }
            if (filters.imei) {
                queryBuilder.andWhere('warranty.imei = :imei', { imei: filters.imei });
            }
            if (filters.device_type) {
                queryBuilder.andWhere('warranty.device_type = :device_type', {
                    device_type: filters.device_type,
                });
            }
            if (filters.customer_phone) {
                queryBuilder.andWhere('warranty.customer_phone = :customer_phone', {
                    customer_phone: filters.customer_phone,
                });
            }
            if (filters.customer_name) {
                queryBuilder.andWhere('(warranty.customer_name LIKE :customer_name OR warranty.customer_last_name LIKE :customer_name)', { customer_name: `%${filters.customer_name}%` });
            }
            if (filters.order_id) {
                queryBuilder.andWhere('warranty.order_id = :order_id', {
                    order_id: filters.order_id,
                });
            }
            if (filters.product_id) {
                queryBuilder.andWhere('warranty.product_id = :product_id', {
                    product_id: filters.product_id,
                });
            }
            const now = new Date();
            if (filters.active_only) {
                queryBuilder.andWhere('warranty.warranty_end >= :now', { now });
            }
            if (filters.expired_only) {
                queryBuilder.andWhere('warranty.warranty_end < :now', { now });
            }
            if (filters.purchase_date_from) {
                queryBuilder.andWhere('warranty.purchase_date >= :purchase_date_from', {
                    purchase_date_from: new Date(filters.purchase_date_from),
                });
            }
            if (filters.purchase_date_to) {
                queryBuilder.andWhere('warranty.purchase_date <= :purchase_date_to', {
                    purchase_date_to: new Date(filters.purchase_date_to),
                });
            }
            if (filters.warranty_end_from) {
                queryBuilder.andWhere('warranty.warranty_end >= :warranty_end_from', {
                    warranty_end_from: new Date(filters.warranty_end_from),
                });
            }
            if (filters.warranty_end_to) {
                queryBuilder.andWhere('warranty.warranty_end <= :warranty_end_to', {
                    warranty_end_to: new Date(filters.warranty_end_to),
                });
            }
        }
        queryBuilder.orderBy('warranty.created_at', 'DESC');
        return queryBuilder.getMany();
    }
    async findOne(id) {
        const warranty = await this.warrantiesRepository.findOne({
            where: { id },
            relations: ['service_cases'],
        });
        if (!warranty) {
            throw new common_1.NotFoundException(`Warranty with ID ${id} not found`);
        }
        return warranty;
    }
    async findByWarrantyId(warrantyId) {
        const warranty = await this.warrantiesRepository.findOne({
            where: { warranty_id: warrantyId },
            relations: ['service_cases'],
        });
        if (!warranty) {
            throw new common_1.NotFoundException(`Warranty with ID ${warrantyId} not found`);
        }
        return warranty;
    }
    async update(id, updateDto) {
        const warranty = await this.findOne(id);
        const updateData = { ...updateDto };
        if (updateDto.purchase_date) {
            updateData.purchase_date = new Date(updateDto.purchase_date);
        }
        if (updateDto.warranty_start) {
            updateData.warranty_start = new Date(updateDto.warranty_start);
        }
        if (updateDto.warranty_end) {
            updateData.warranty_end = new Date(updateDto.warranty_end);
        }
        Object.assign(warranty, updateData);
        return this.warrantiesRepository.save(warranty);
    }
    async extendWarranty(id, days) {
        const warranty = await this.findOne(id);
        if (days <= 0) {
            throw new common_1.BadRequestException('Extension days must be positive');
        }
        warranty.extended_days += days;
        warranty.warranty_end = new Date(new Date(warranty.warranty_end).getTime() + days * 24 * 60 * 60 * 1000);
        return this.warrantiesRepository.save(warranty);
    }
    async remove(id, deletedBy) {
        const warranty = await this.findOne(id);
        if (warranty.service_cases && warranty.service_cases.length > 0) {
            throw new common_1.BadRequestException('Cannot delete warranty with associated service cases');
        }
        await this.auditService.log(deletedBy, 'warranty.deleted', {
            warranty_id: warranty.id,
            warranty_number: warranty.warranty_id,
            customer_name: warranty.customer_name,
            customer_last_name: warranty.customer_last_name,
            customer_phone: warranty.customer_phone,
            product_title: warranty.title,
            sku: warranty.sku,
            serial_number: warranty.serial_number,
            deleted_at: new Date().toISOString(),
        });
        await this.warrantiesRepository.remove(warranty);
    }
    async getStats(startDate, endDate) {
        const queryBuilder = this.warrantiesRepository.createQueryBuilder('warranty');
        const now = new Date();
        const activeCount = await this.warrantiesRepository.count({
            where: {
                warranty_end: (0, typeorm_2.MoreThan)(now),
            },
        });
        const expiredCount = await this.warrantiesRepository.count({
            where: {
                warranty_end: (0, typeorm_2.LessThan)(now),
            },
        });
        const totalCount = await this.warrantiesRepository.count();
        const expiringSoonDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const expiringSoonCount = await this.warrantiesRepository.count({
            where: {
                warranty_end: (0, typeorm_2.Between)(now, expiringSoonDate),
            },
        });
        return {
            total: totalCount,
            active: activeCount,
            expired: expiredCount,
            expiringSoon: expiringSoonCount,
        };
    }
};
exports.WarrantiesService = WarrantiesService;
exports.WarrantiesService = WarrantiesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(warranty_entity_1.Warranty)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        audit_service_1.AuditService])
], WarrantiesService);
//# sourceMappingURL=warranties.service.js.map