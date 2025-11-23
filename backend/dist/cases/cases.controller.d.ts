import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { ResultType, Priority } from './entities/service-case.entity';
export declare class CasesController {
    private casesService;
    constructor(casesService: CasesService);
    findAll(status?: string, result?: ResultType, priority?: Priority, device_type?: string, technician_id?: string, tags?: string, search?: string, start_date?: string, end_date?: string): Promise<import("./entities/service-case.entity").ServiceCase[]>;
    findOne(id: number): Promise<import("./entities/service-case.entity").ServiceCase>;
    create(createDto: CreateCaseDto, req: any): Promise<import("./entities/service-case.entity").ServiceCase>;
    update(id: number, updateDto: UpdateCaseDto, req: any): Promise<import("./entities/service-case.entity").ServiceCase>;
    changeStatus(id: number, changeStatusDto: ChangeStatusDto, req: any): Promise<import("./entities/service-case.entity").ServiceCase>;
    reopen(id: number, req: any): Promise<import("./entities/service-case.entity").ServiceCase>;
    remove(id: number, req: any): Promise<void>;
}
