import { Repository } from 'typeorm';
import { CaseFile } from './entities/case-file.entity';
import { ServiceCase } from '../cases/entities/service-case.entity';
export declare class FilesService {
    private filesRepository;
    private casesRepository;
    private readonly uploadsDir;
    constructor(filesRepository: Repository<CaseFile>, casesRepository: Repository<ServiceCase>);
    private detectFileType;
    uploadFile(caseId: number, file: any, uploadedBy: number): Promise<CaseFile>;
    findAllByCase(caseId: number): Promise<CaseFile[]>;
    findOne(id: number): Promise<CaseFile>;
    remove(id: number): Promise<void>;
    getFilePath(fileUrl: string): string;
}
