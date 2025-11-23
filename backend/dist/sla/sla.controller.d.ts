import { SlaService } from './sla.service';
export declare class SlaController {
    private slaService;
    constructor(slaService: SlaService);
    getMetrics(): Promise<import("./sla.service").SLAMetrics>;
    getCasesCloseToDeadline(days?: number): Promise<import("../cases/entities/service-case.entity").ServiceCase[]>;
    getDueCases(): Promise<import("../cases/entities/service-case.entity").ServiceCase[]>;
    getStalledCases(days?: number): Promise<import("../cases/entities/service-case.entity").ServiceCase[]>;
    checkAlerts(): Promise<void>;
}
