import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Like, In } from 'typeorm';
import { ServiceCase, CaseStatusLevel, ResultType, Priority } from './entities/service-case.entity';
import { CaseStatusHistory } from './entities/case-status-history.entity';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { SmsService } from '../sms/sms.service';
import { Language } from '../sms/entities/sms-template.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CasesService {
  constructor(
    @InjectRepository(ServiceCase)
    private casesRepository: Repository<ServiceCase>,
    @InjectRepository(CaseStatusHistory)
    private historyRepository: Repository<CaseStatusHistory>,
    private usersService: UsersService,
    private smsService: SmsService,
    private auditService: AuditService,
  ) {}

  async generateCaseNumber(): Promise<string> {
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

  async create(createDto: CreateCaseDto, createdBy: number): Promise<ServiceCase> {
    // Validate IMEI for phones
    if (createDto.device_type.toLowerCase() === 'phone' && !createDto.imei) {
      throw new BadRequestException('IMEI is required for phone devices');
    }

    const caseNumber = await this.generateCaseNumber();
    const now = new Date();
    const deadlineDays = createDto.deadline_days || 14; // Default 14 days
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
      status_level: CaseStatusLevel.OPENED,
      priority: createDto.priority || Priority.NORMAL,
      tags: createDto.tags || [],
      assigned_technician_id: createDto.assigned_technician_id,
      created_by: createdBy,
    });

    const savedCase = await this.casesRepository.save(newCase);

    // Create initial history entry
    await this.createHistoryEntry(savedCase.id, createdBy, null, CaseStatusLevel.OPENED, null, null);

    // Send SMS notification when case is opened
    if (savedCase.customer_phone) {
      try {
        await this.smsService.sendSms({
          phone: savedCase.customer_phone,
          templateKey: 'sms.case.opened',
          language: Language.KA,
          variables: {
            case_number: savedCase.case_number,
            product_title: savedCase.product_title,
            deadline: savedCase.deadline_at.toLocaleDateString('ka-GE'),
          },
        });
      } catch (error) {
        // Log error but don't fail case creation
        console.error('Failed to send SMS notification:', error);
      }
    }

    return savedCase;
  }

  async findAll(filters?: {
    status?: CaseStatusLevel;
    result?: ResultType;
    priority?: Priority;
    device_type?: string;
    technician_id?: number;
    tags?: string[];
    search?: string;
    start_date?: Date;
    end_date?: Date;
  }): Promise<ServiceCase[]> {
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
        // Use JSON_SEARCH for MySQL compatibility
        const tagConditions = filters.tags.map((tag, index) => {
          return `JSON_SEARCH(case.tags, 'one', :tag${index}) IS NOT NULL`;
        });
        filters.tags.forEach((tag, index) => {
          query.setParameter(`tag${index}`, tag);
        });
        query.andWhere(`(${tagConditions.join(' OR ')})`);
      }

      if (filters?.search) {
        query.andWhere(
          '(case.case_number LIKE :search OR case.product_title LIKE :search OR case.customer_name LIKE :search OR case.customer_phone LIKE :search)',
          { search: `%${filters.search}%` },
        );
      }

      if (filters?.start_date) {
        query.andWhere('case.opened_at >= :start_date', { start_date: filters.start_date });
      }

      if (filters?.end_date) {
        query.andWhere('case.opened_at <= :end_date', { end_date: filters.end_date });
      }

      return await query.getMany();
    } catch (error) {
      console.error('Error in findAll cases:', error);
      throw error;
    }
  }

  async findOne(id: number): Promise<ServiceCase> {
    const case_ = await this.casesRepository.findOne({
      where: { id },
      relations: ['assigned_technician', 'warranty', 'status_history', 'payments', 'files'],
    });

    if (!case_) {
      throw new NotFoundException(`Case with ID ${id} not found`);
    }

    return case_;
  }

  async update(id: number, updateDto: UpdateCaseDto, userId: number): Promise<ServiceCase> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const case_ = await this.findOne(id);

    // Only admin can update certain fields
    if (user.role !== UserRole.ADMIN) {
      // Technicians can only update limited fields
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

    // Audit log
    await this.auditService.log(userId, 'CASE_UPDATED', {
      caseId: id,
      oldData,
      newData: savedCase,
    });

    return savedCase;
  }

  async changeStatus(
    id: number,
    changeStatusDto: ChangeStatusDto,
    userId: number,
  ): Promise<ServiceCase> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const case_ = await this.findOne(id);

    const previousStatus = case_.status_level;
    const previousResult = case_.result_type;
    const newStatus = changeStatusDto.new_status_level;
    const newResult = changeStatusDto.result_type;

    // Role-based restrictions
    if (user.role === UserRole.TECHNICIAN) {
      // Technicians can only move forward
      if (newStatus <= previousStatus) {
        throw new ForbiddenException('Technicians can only move status forward');
      }

      // Technicians cannot reopen completed cases
      if (case_.status_level === CaseStatusLevel.COMPLETED) {
        throw new ForbiddenException('Technicians cannot reopen completed cases');
      }
    }

    // Update status
    case_.status_level = newStatus;

    // Update result if provided
    if (newResult) {
      case_.result_type = newResult;
    }

    // Set closed_at if completing
    if (newStatus === CaseStatusLevel.COMPLETED && !case_.closed_at) {
      case_.closed_at = new Date();
    }

    // Clear closed_at if reopening
    if (newStatus < CaseStatusLevel.COMPLETED && case_.closed_at) {
      case_.closed_at = null;
    }

    const savedCase = await this.casesRepository.save(case_);

    // Audit log
    await this.auditService.log(user.id, 'CASE_STATUS_CHANGED', {
      caseId: id,
      previousStatus,
      newStatus,
      previousResult,
      newResult,
    });

    // Create history entry
    await this.createHistoryEntry(
      id,
      user.id,
      previousStatus,
      newStatus,
      previousResult,
      newResult,
      changeStatusDto.note_public,
      changeStatusDto.note_private,
    );

    // Send SMS notification if status changed and public note exists
    if (changeStatusDto.note_public && case_.customer_phone) {
      try {
        await this.smsService.sendSms({
          phone: case_.customer_phone,
          templateKey: 'sms.case.status_change',
          language: Language.KA,
          variables: {
            case_number: case_.case_number,
            status: this.getStatusLabel(newStatus),
            note: changeStatusDto.note_public,
          },
        });
      } catch (error) {
        // Log error but don't fail the status change
        console.error('Failed to send SMS notification:', error);
      }
    }

    // Send SMS if case is completed
    if (newStatus === CaseStatusLevel.COMPLETED && case_.customer_phone) {
      try {
        await this.smsService.sendSms({
          phone: case_.customer_phone,
          templateKey: 'sms.case.completed',
          language: Language.KA,
          variables: {
            case_number: case_.case_number,
            result: newResult || 'completed',
          },
        });
      } catch (error) {
        console.error('Failed to send completion SMS:', error);
      }
    }

    return savedCase;
  }

  async reopen(id: number, userId: number): Promise<ServiceCase> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can reopen cases');
    }

    const case_ = await this.findOne(id);
    if (case_.status_level !== CaseStatusLevel.COMPLETED) {
      throw new BadRequestException('Case is not completed');
    }

    case_.status_level = CaseStatusLevel.PENDING;
    case_.closed_at = null;

    const savedCase = await this.casesRepository.save(case_);

    await this.createHistoryEntry(
      id,
      user.id,
      CaseStatusLevel.COMPLETED,
      CaseStatusLevel.PENDING,
      case_.result_type,
      case_.result_type,
      'Case reopened by admin',
      null,
    );

    return savedCase;
  }

  private async createHistoryEntry(
    caseId: number,
    changedBy: number,
    previousStatus: CaseStatusLevel | null,
    newStatus: CaseStatusLevel,
    previousResult: ResultType | null,
    newResult: ResultType | null,
    notePublic?: string,
    notePrivate?: string,
  ): Promise<CaseStatusHistory> {
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

  async remove(id: number, deletedBy: number): Promise<void> {
    const case_ = await this.findOne(id);
    
    // Log deletion in audit before removing
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

    // Delete associated records (history, payments, files will be cascade deleted if configured)
    await this.historyRepository.delete({ case_id: id });
    
    // Remove the case
    await this.casesRepository.remove(case_);
  }

  private getStatusLabel(status: CaseStatusLevel): string {
    const labels = {
      [CaseStatusLevel.OPENED]: 'ღია',
      [CaseStatusLevel.INVESTIGATING]: 'კვლევა',
      [CaseStatusLevel.PENDING]: 'მოლოდინში',
      [CaseStatusLevel.COMPLETED]: 'დასრულებული',
    };
    return labels[status] || 'უცნობი';
  }
}
