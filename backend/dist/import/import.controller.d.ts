import { Response } from 'express';
import { ImportService } from './import.service';
type MulterFile = any;
export declare class ImportController {
    private importService;
    private readonly logger;
    constructor(importService: ImportService);
    importCases(file: MulterFile, user: any): Promise<unknown>;
    importWarranties(file: MulterFile, user: any): Promise<{
        success: boolean;
        jobId: string;
        message: string;
    }>;
    getImportProgress(jobId: string): import("./import.service").ImportProgressState;
    cancelImport(jobId: string): {
        success: boolean;
        message: string;
    };
    downloadCasesExample(res: Response): Promise<void>;
    downloadWarrantiesExample(res: Response): Promise<void>;
}
export {};
