import { Repository } from 'typeorm';
import { ServiceCase } from '../cases/entities/service-case.entity';
import { Warranty } from '../warranties/entities/warranty.entity';
import { CasePayment } from '../payments/entities/case-payment.entity';
export declare class DashboardService {
    private casesRepository;
    private warrantiesRepository;
    private paymentsRepository;
    constructor(casesRepository: Repository<ServiceCase>, warrantiesRepository: Repository<Warranty>, paymentsRepository: Repository<CasePayment>);
    getDashboardStats(timeFilter?: {
        start?: Date;
        end?: Date;
    }): Promise<{
        realTime: {
            openCases: number;
            closeToDeadline: number;
            dueCases: number;
        };
        timeFiltered: {
            closedCases: number;
            activeWarranties: number;
            expiredWarranties: number;
            avgCompletionTime: number;
            avgCompletionByDeviceType: {};
            onTimeCases: number;
            totalPayments: number;
            totalMoneyIn: number;
            totalMoneyLost: number;
        };
    }>;
    getAvgCompletionByDeviceType(deviceType: string, timeFilter?: {
        start?: Date;
        end?: Date;
    }): Promise<number>;
}
