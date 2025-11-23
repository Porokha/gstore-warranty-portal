import { Repository } from 'typeorm';
import { ServiceCase } from '../cases/entities/service-case.entity';
import { User } from '../users/entities/user.entity';
import { CasePayment } from '../payments/entities/case-payment.entity';
export declare class StatisticsService {
    private casesRepository;
    private usersRepository;
    private paymentsRepository;
    constructor(casesRepository: Repository<ServiceCase>, usersRepository: Repository<User>, paymentsRepository: Repository<CasePayment>);
    getTechnicianStats(technicianId?: number, startDate?: string, endDate?: string): Promise<{
        technicianId: number;
        period: {
            start: Date;
            end: Date;
        };
        totalCases: number;
        runningCases: number;
        completedCases: number;
        avgCompletionTime: number;
        onTimeCases: number;
        onTimeRate: string;
        casesByStatus: {
            opened: number;
            investigating: number;
            pending: number;
            completed: number;
        };
        casesByPriority: {
            low: number;
            normal: number;
            high: number;
            critical: number;
        };
        totalPayments: number;
        paidPayments: number;
        totalPaidAmount: number;
    }>;
    getAllTechniciansStats(startDate?: string, endDate?: string): Promise<{
        technicianId: number;
        period: {
            start: Date;
            end: Date;
        };
        totalCases: number;
        runningCases: number;
        completedCases: number;
        avgCompletionTime: number;
        onTimeCases: number;
        onTimeRate: string;
        casesByStatus: {
            opened: number;
            investigating: number;
            pending: number;
            completed: number;
        };
        casesByPriority: {
            low: number;
            normal: number;
            high: number;
            critical: number;
        };
        totalPayments: number;
        paidPayments: number;
        totalPaidAmount: number;
        technician: {
            id: number;
            name: string;
            last_name: string;
            username: string;
        };
    }[]>;
    exportToExcel(stats: any): Promise<Buffer>;
    exportAllToExcel(stats: any[]): Promise<Buffer>;
}
