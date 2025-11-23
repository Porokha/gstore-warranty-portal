import { Response } from 'express';
import { FilesService } from './files.service';
type MulterFile = any;
export declare class FilesController {
    private filesService;
    constructor(filesService: FilesService);
    uploadFile(caseId: number, file: MulterFile, user: any): Promise<import("./entities/case-file.entity").CaseFile>;
    findAllByCase(caseId: number): Promise<import("./entities/case-file.entity").CaseFile[]>;
    findOne(id: number): Promise<import("./entities/case-file.entity").CaseFile>;
    downloadFile(id: number, res: Response): Promise<void>;
    remove(id: number): Promise<void>;
}
export {};
