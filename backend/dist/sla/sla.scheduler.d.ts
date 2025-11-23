import { SlaService } from './sla.service';
export declare class SlaScheduler {
    private slaService;
    private readonly logger;
    constructor(slaService: SlaService);
    handleSLAAlerts(): Promise<void>;
}
