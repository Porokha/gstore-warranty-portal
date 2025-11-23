import { Response } from 'express';
import { ImportService } from './import.service';
type MulterFile = any;
export declare class ImportController {
    private importService;
    constructor(importService: ImportService);
    importCases(file: MulterFile, user: any): Promise<unknown>;
    importWarranties(file: MulterFile, user: any): Promise<unknown>;
    downloadCasesExample(res: Response): Promise<void>;
    downloadWarrantiesExample(res: Response): Promise<void>;
}
export {};
