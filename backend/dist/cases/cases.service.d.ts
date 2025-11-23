import { Repository } from 'typeorm';
import { ServiceCase, CaseStatusLevel, ResultType, Priority } from './entities/service-case.entity';
import { CaseStatusHistory } from './entities/case-status-history.entity';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { UsersService } from '../users/users.service';
import { SmsService } from '../sms/sms.service';
import { AuditService } from '../audit/audit.service';
export declare class CasesService {
    private casesRepository;
    private historyRepository;
    private usersService;
    private smsService;
    private auditService;
    constructor(casesRepository: Repository<ServiceCase>, historyRepository: Repository<CaseStatusHistory>, usersService: UsersService, smsService: SmsService, auditService: AuditService);
    generateCaseNumber(): Promise<string>;
    create(createDto: CreateCaseDto, createdBy: number): Promise<ServiceCase>;
    findAll(filters?: {
        status?: CaseStatusLevel;
        result?: ResultType;
        priority?: Priority;
        device_type?: string;
        technician_id?: number;
        tags?: string[];
        search?: string;
        start_date?: Date;
        end_date?: Date;
    }): Promise<ServiceCase[]>;
    findOne(id: number): Promise<ServiceCase>;
    update(id: number, updateDto: UpdateCaseDto, userId: number): Promise<ServiceCase>;
    changeStatus(id: number, changeStatusDto: ChangeStatusDto, userId: number): Promise<ServiceCase>;
    reopen(id: number, userId: number): Promise<ServiceCase>;
    private createHistoryEntry;
    remove(id: number, deletedBy: number): Promise<void>;
    private getStatusLabel;
}
