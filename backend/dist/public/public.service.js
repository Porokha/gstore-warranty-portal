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
exports.PublicService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const warranty_entity_1 = require("../warranties/entities/warranty.entity");
const service_case_entity_1 = require("../cases/entities/service-case.entity");
const case_status_history_entity_1 = require("../cases/entities/case-status-history.entity");
let PublicService = class PublicService {
    constructor(warrantiesRepository, casesRepository, historyRepository) {
        this.warrantiesRepository = warrantiesRepository;
        this.casesRepository = casesRepository;
        this.historyRepository = historyRepository;
    }
    async searchWarranty(searchDto) {
        const warranty = await this.warrantiesRepository.findOne({
            where: { warranty_id: searchDto.warranty_id },
            relations: ['service_cases'],
        });
        if (!warranty) {
            throw new common_1.NotFoundException('Warranty not found');
        }
        if (warranty.customer_phone !== searchDto.phone) {
            throw new common_1.UnauthorizedException('Phone number does not match');
        }
        const now = new Date();
        const warrantyEnd = new Date(warranty.warranty_end);
        const isActive = warrantyEnd >= now;
        const daysLeft = isActive
            ? Math.ceil((warrantyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : Math.ceil((now.getTime() - warrantyEnd.getTime()) / (1000 * 60 * 60 * 24));
        const serviceCases = warranty.service_cases?.map((c) => ({
            id: c.id,
            case_number: c.case_number,
            status_level: c.status_level,
            opened_at: c.opened_at,
        })) || [];
        return {
            warranty_id: warranty.warranty_id,
            title: warranty.title,
            sku: warranty.sku,
            serial_number: warranty.serial_number,
            device_type: warranty.device_type,
            purchase_date: warranty.purchase_date,
            warranty_start: warranty.warranty_start,
            warranty_end: warranty.warranty_end,
            is_active: isActive,
            days_left: isActive ? daysLeft : null,
            days_after_warranty: !isActive ? daysLeft : null,
            extended_days: warranty.extended_days,
            service_cases_count: serviceCases.length,
            service_cases: serviceCases,
        };
    }
    async searchCase(searchDto) {
        const case_ = await this.casesRepository.findOne({
            where: { case_number: searchDto.case_number },
            relations: ['warranty', 'assigned_technician'],
        });
        if (!case_) {
            throw new common_1.NotFoundException('Case not found');
        }
        if (case_.customer_phone !== searchDto.phone) {
            throw new common_1.UnauthorizedException('Phone number does not match');
        }
        const history = await this.historyRepository.find({
            where: { case_id: case_.id },
            order: { created_at: 'DESC' },
        });
        const publicHistory = history
            .filter((h) => h.note_public)
            .map((h) => ({
            created_at: h.created_at,
            note_public: h.note_public,
            new_status_level: h.new_status_level,
            new_result: h.new_result,
        }));
        let warrantyStatus = null;
        if (case_.warranty) {
            const now = new Date();
            const warrantyEnd = new Date(case_.warranty.warranty_end);
            warrantyStatus = {
                is_active: warrantyEnd >= now,
                warranty_end: case_.warranty.warranty_end,
            };
        }
        return {
            case_number: case_.case_number,
            product_title: case_.product_title,
            device_type: case_.device_type,
            opened_at: case_.opened_at,
            deadline_at: case_.deadline_at,
            status_level: case_.status_level,
            result_type: case_.result_type,
            status_history: publicHistory,
            warranty_id: case_.warranty?.warranty_id || null,
            warranty_status: warrantyStatus,
            customer_name: case_.customer_name,
            customer_last_name: case_.customer_last_name || null,
            customer_initial_note: case_.customer_initial_note || null,
            assigned_technician: case_.assigned_technician
                ? {
                    name: case_.assigned_technician.name,
                    last_name: case_.assigned_technician.last_name,
                }
                : null,
        };
    }
};
exports.PublicService = PublicService;
exports.PublicService = PublicService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(warranty_entity_1.Warranty)),
    __param(1, (0, typeorm_1.InjectRepository)(service_case_entity_1.ServiceCase)),
    __param(2, (0, typeorm_1.InjectRepository)(case_status_history_entity_1.CaseStatusHistory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PublicService);
//# sourceMappingURL=public.service.js.map