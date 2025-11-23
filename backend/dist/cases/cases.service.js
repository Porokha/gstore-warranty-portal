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
exports.CasesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const service_case_entity_1 = require("./entities/service-case.entity");
const case_status_history_entity_1 = require("./entities/case-status-history.entity");
const user_entity_1 = require("../users/entities/user.entity");
const users_service_1 = require("../users/users.service");
const sms_service_1 = require("../sms/sms.service");
const sms_template_entity_1 = require("../sms/entities/sms-template.entity");
const audit_service_1 = require("../audit/audit.service");
let CasesService = class CasesService {
    constructor(casesRepository, historyRepository, usersService, smsService, auditService) {
        this.casesRepository = casesRepository;
        this.historyRepository = historyRepository;
        this.usersService = usersService;
        this.smsService = smsService;
        this.auditService = auditService;
    }
    async generateCaseNumber() {
        const lastCase = await this.casesRepository.findOne({
            where: {},
            order: { id: 'DESC' },
        });
        let nextNumber = 1;
        if (lastCase && lastCase.case_number) {
            const match = lastCase.case_number.match(/SCN-(\d+)/);
            if (match) {
                nextNumber = parseInt(match[1], 10) + 1;
            }
        }
        return `SCN-${nextNumber.toString().padStart(6, '0')}`;
    }
    async create(createDto, createdBy) {
        if (createDto.device_type.toLowerCase() === 'phone' && !createDto.imei) {
            throw new common_1.BadRequestException('IMEI is required for phone devices');
        }
        const caseNumber = await this.generateCaseNumber();
        const now = new Date();
        const deadlineDays = createDto.deadline_days || 14;
        const deadlineAt = new Date(now.getTime() + deadlineDays * 24 * 60 * 60 * 1000);
        const newCase = this.casesRepository.create({
            case_number: caseNumber,
            warranty_id: createDto.warranty_id,
            sku: createDto.sku,
            imei: createDto.imei,
            serial_number: createDto.serial_number,
            device_type: createDto.device_type,
            product_title: createDto.product_title,
            customer_name: createDto.customer_name,
            customer_phone: createDto.customer_phone,
            customer_email: createDto.customer_email,
            order_id: createDto.order_id,
            product_id: createDto.product_id,
            opened_at: now,
            deadline_at: deadlineAt,
            status_level: service_case_entity_1.CaseStatusLevel.OPENED,
            priority: createDto.priority || service_case_entity_1.Priority.NORMAL,
            tags: createDto.tags || [],
            assigned_technician_id: createDto.assigned_technician_id,
            created_by: createdBy,
        });
        const savedCase = await this.casesRepository.save(newCase);
        await this.createHistoryEntry(savedCase.id, createdBy, null, service_case_entity_1.CaseStatusLevel.OPENED, null, null);
        if (savedCase.customer_phone) {
            try {
                await this.smsService.sendSms({
                    phone: savedCase.customer_phone,
                    templateKey: 'sms.case.opened',
                    language: sms_template_entity_1.Language.KA,
                    variables: {
                        case_number: savedCase.case_number,
                        product_title: savedCase.product_title,
                        deadline: savedCase.deadline_at.toLocaleDateString('ka-GE'),
                    },
                });
            }
            catch (error) {
                console.error('Failed to send SMS notification:', error);
            }
        }
        return savedCase;
    }
    async findAll(filters) {
        try {
            const query = this.casesRepository.createQueryBuilder('case')
                .leftJoinAndSelect('case.assigned_technician', 'technician')
                .leftJoinAndSelect('case.warranty', 'warranty')
                .orderBy('case.opened_at', 'DESC');
            if (filters?.status !== undefined) {
                query.andWhere('case.status_level = :status', { status: filters.status });
            }
            if (filters?.result) {
                query.andWhere('case.result_type = :result', { result: filters.result });
            }
            if (filters?.priority) {
                query.andWhere('case.priority = :priority', { priority: filters.priority });
            }
            if (filters?.device_type) {
                query.andWhere('case.device_type = :device_type', { device_type: filters.device_type });
            }
            if (filters?.technician_id) {
                query.andWhere('case.assigned_technician_id = :technician_id', {
                    technician_id: filters.technician_id,
                });
            }
            if (filters?.tags && filters.tags.length > 0) {
                const tagConditions = filters.tags.map((tag, index) => {
                    return `JSON_SEARCH(case.tags, 'one', :tag${index}) IS NOT NULL`;
                });
                filters.tags.forEach((tag, index) => {
                    query.setParameter(`tag${index}`, tag);
                });
                query.andWhere(`(${tagConditions.join(' OR ')})`);
            }
            if (filters?.search) {
                query.andWhere('(case.case_number LIKE :search OR case.product_title LIKE :search OR case.customer_name LIKE :search OR case.customer_phone LIKE :search)', { search: `%${filters.search}%` });
            }
            if (filters?.start_date) {
                query.andWhere('case.opened_at >= :start_date', { start_date: filters.start_date });
            }
            if (filters?.end_date) {
                query.andWhere('case.opened_at <= :end_date', { end_date: filters.end_date });
            }
            return await query.getMany();
        }
        catch (error) {
            console.error('Error in findAll cases:', error);
            throw error;
        }
    }
    async findOne(id) {
        const case_ = await this.casesRepository.findOne({
            where: { id },
            relations: ['assigned_technician', 'warranty', 'status_history', 'payments', 'files'],
        });
        if (!case_) {
            throw new common_1.NotFoundException(`Case with ID ${id} not found`);
        }
        return case_;
    }
    async update(id, updateDto, userId) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const case_ = await this.findOne(id);
        if (user.role !== user_entity_1.UserRole.ADMIN) {
            const allowedFields = ['assigned_technician_id', 'priority', 'tags'];
            Object.keys(updateDto).forEach((key) => {
                if (!allowedFields.includes(key)) {
                    delete updateDto[key];
                }
            });
        }
        const oldData = { ...case_ };
        Object.assign(case_, updateDto);
        if (updateDto.deadline_at) {
            case_.deadline_at = new Date(updateDto.deadline_at);
        }
        const savedCase = await this.casesRepository.save(case_);
        await this.auditService.log(userId, 'CASE_UPDATED', {
            caseId: id,
            oldData,
            newData: savedCase,
        });
        return savedCase;
    }
    async changeStatus(id, changeStatusDto, userId) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const case_ = await this.findOne(id);
        const previousStatus = case_.status_level;
        const previousResult = case_.result_type;
        const newStatus = changeStatusDto.new_status_level;
        const newResult = changeStatusDto.result_type;
        if (user.role === user_entity_1.UserRole.TECHNICIAN) {
            if (newStatus <= previousStatus) {
                throw new common_1.ForbiddenException('Technicians can only move status forward');
            }
            if (case_.status_level === service_case_entity_1.CaseStatusLevel.COMPLETED) {
                throw new common_1.ForbiddenException('Technicians cannot reopen completed cases');
            }
        }
        case_.status_level = newStatus;
        if (newResult) {
            case_.result_type = newResult;
        }
        if (newStatus === service_case_entity_1.CaseStatusLevel.COMPLETED && !case_.closed_at) {
            case_.closed_at = new Date();
        }
        if (newStatus < service_case_entity_1.CaseStatusLevel.COMPLETED && case_.closed_at) {
            case_.closed_at = null;
        }
        const savedCase = await this.casesRepository.save(case_);
        await this.auditService.log(user.id, 'CASE_STATUS_CHANGED', {
            caseId: id,
            previousStatus,
            newStatus,
            previousResult,
            newResult,
        });
        await this.createHistoryEntry(id, user.id, previousStatus, newStatus, previousResult, newResult, changeStatusDto.note_public, changeStatusDto.note_private);
        if (changeStatusDto.note_public && case_.customer_phone) {
            try {
                await this.smsService.sendSms({
                    phone: case_.customer_phone,
                    templateKey: 'sms.case.status_change',
                    language: sms_template_entity_1.Language.KA,
                    variables: {
                        case_number: case_.case_number,
                        status: this.getStatusLabel(newStatus),
                        note: changeStatusDto.note_public,
                    },
                });
            }
            catch (error) {
                console.error('Failed to send SMS notification:', error);
            }
        }
        if (newStatus === service_case_entity_1.CaseStatusLevel.COMPLETED && case_.customer_phone) {
            try {
                await this.smsService.sendSms({
                    phone: case_.customer_phone,
                    templateKey: 'sms.case.completed',
                    language: sms_template_entity_1.Language.KA,
                    variables: {
                        case_number: case_.case_number,
                        result: newResult || 'completed',
                    },
                });
            }
            catch (error) {
                console.error('Failed to send completion SMS:', error);
            }
        }
        return savedCase;
    }
    async reopen(id, userId) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.role !== user_entity_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only admins can reopen cases');
        }
        const case_ = await this.findOne(id);
        if (case_.status_level !== service_case_entity_1.CaseStatusLevel.COMPLETED) {
            throw new common_1.BadRequestException('Case is not completed');
        }
        case_.status_level = service_case_entity_1.CaseStatusLevel.PENDING;
        case_.closed_at = null;
        const savedCase = await this.casesRepository.save(case_);
        await this.createHistoryEntry(id, user.id, service_case_entity_1.CaseStatusLevel.COMPLETED, service_case_entity_1.CaseStatusLevel.PENDING, case_.result_type, case_.result_type, 'Case reopened by admin', null);
        return savedCase;
    }
    async createHistoryEntry(caseId, changedBy, previousStatus, newStatus, previousResult, newResult, notePublic, notePrivate) {
        const history = this.historyRepository.create({
            case_id: caseId,
            changed_by: changedBy,
            previous_status_level: previousStatus,
            new_status_level: newStatus,
            previous_result: previousResult,
            new_result: newResult,
            note_public: notePublic,
            note_private: notePrivate,
        });
        return this.historyRepository.save(history);
    }
    async remove(id, deletedBy) {
        const case_ = await this.findOne(id);
        await this.auditService.log(deletedBy, 'case.deleted', {
            case_id: case_.id,
            case_number: case_.case_number,
            customer_name: case_.customer_name,
            customer_phone: case_.customer_phone,
            product_title: case_.product_title,
            status_level: case_.status_level,
            result_type: case_.result_type,
            deleted_at: new Date().toISOString(),
        });
        await this.historyRepository.delete({ case_id: id });
        await this.casesRepository.remove(case_);
    }
    getStatusLabel(status) {
        const labels = {
            [service_case_entity_1.CaseStatusLevel.OPENED]: 'ღია',
            [service_case_entity_1.CaseStatusLevel.INVESTIGATING]: 'კვლევა',
            [service_case_entity_1.CaseStatusLevel.PENDING]: 'მოლოდინში',
            [service_case_entity_1.CaseStatusLevel.COMPLETED]: 'დასრულებული',
        };
        return labels[status] || 'უცნობი';
    }
};
exports.CasesService = CasesService;
exports.CasesService = CasesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(service_case_entity_1.ServiceCase)),
    __param(1, (0, typeorm_1.InjectRepository)(case_status_history_entity_1.CaseStatusHistory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        users_service_1.UsersService,
        sms_service_1.SmsService,
        audit_service_1.AuditService])
], CasesService);
//# sourceMappingURL=cases.service.js.map