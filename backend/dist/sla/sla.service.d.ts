import { Repository } from 'typeorm';
import { ServiceCase } from '../cases/entities/service-case.entity';
import { SmsService } from '../sms/sms.service';
export interface SLAMetrics {
    totalOpenCases: number;
    casesCloseToDeadline: number;
    casesDue: number;
    casesStalled: number;
    avgDaysToCompletion: number;
    onTimeCompletionRate: number;
}
export declare class SlaService {
    private casesRepository;
    private smsService;
    private readonly logger;
    constructor(casesRepository: Repository<ServiceCase>, smsService: SmsService);
    getMetrics(): Promise<SLAMetrics>;
    checkSLAAlerts(): Promise<void>;
    private sendSLAAlert;
    getCasesCloseToDeadline(days?: number): Promise<ServiceCase[]>;
    getDueCases(): Promise<ServiceCase[]>;
    getStalledCases(days?: number): Promise<ServiceCase[]>;
}
