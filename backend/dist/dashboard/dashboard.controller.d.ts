import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private dashboardService;
    private readonly logger;
    constructor(dashboardService: DashboardService);
    getStats(start?: string, end?: string, deviceType?: string): Promise<{
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
}
