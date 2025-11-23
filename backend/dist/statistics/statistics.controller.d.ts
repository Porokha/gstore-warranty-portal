import { Response } from 'express';
import { StatisticsService } from './statistics.service';
export declare class StatisticsController {
    private statisticsService;
    constructor(statisticsService: StatisticsService);
    getTechnicianStats(technicianId?: string, startDate?: string, endDate?: string, req?: any): Promise<{
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
    exportTechnicianStats(technicianId?: string, startDate?: string, endDate?: string, req?: any, res?: Response): Promise<void>;
    exportAllTechniciansStats(startDate?: string, endDate?: string, res?: Response): Promise<void>;
}
