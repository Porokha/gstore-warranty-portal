import { Repository } from 'typeorm';
import { ServiceCase } from '../cases/entities/service-case.entity';
import { Warranty } from '../warranties/entities/warranty.entity';
import { CasesService } from '../cases/cases.service';
import { WarrantiesService } from '../warranties/warranties.service';
export declare class ImportService {
    private casesRepository;
    private warrantiesRepository;
    private casesService;
    private warrantiesService;
    constructor(casesRepository: Repository<ServiceCase>, warrantiesRepository: Repository<Warranty>, casesService: CasesService, warrantiesService: WarrantiesService);
    importCasesFromCSV(filePath: string, userId: number): Promise<unknown>;
    importWarrantiesFromCSV(filePath: string, userId: number): Promise<unknown>;
    generateCasesExampleCSV(): string;
    generateWarrantiesExampleCSV(): string;
}
