import { Repository } from 'typeorm';
import { ServiceCase } from '../cases/entities/service-case.entity';
import { Warranty } from '../warranties/entities/warranty.entity';
import { CasesService } from '../cases/cases.service';
import { WarrantiesService } from '../warranties/warranties.service';
export interface ImportProgressState {
    total: number;
    processed: number;
    imported: number;
    skipped: number;
    errors: number;
    status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled' | 'not_found';
    message?: string;
    error?: string;
    result?: any;
    cancelRequested?: boolean;
}
export declare class ImportService {
    private casesRepository;
    private warrantiesRepository;
    private casesService;
    private warrantiesService;
    private readonly logger;
    private importProgress;
    constructor(casesRepository: Repository<ServiceCase>, warrantiesRepository: Repository<Warranty>, casesService: CasesService, warrantiesService: WarrantiesService);
    importCasesFromCSV(filePath: string, userId: number): Promise<unknown>;
    importWarrantiesFromCSV(filePath: string, userId: number, jobId?: string): Promise<unknown>;
    getImportProgress(jobId: string): ImportProgressState | null;
    cancelImport(jobId: string): {
        success: boolean;
        message: string;
    };
    generateCasesExampleCSV(): string;
    generateWarrantiesExampleCSV(): string;
}
