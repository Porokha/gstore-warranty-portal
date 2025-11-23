import { Repository } from 'typeorm';
import { Warranty } from '../warranties/entities/warranty.entity';
import { ServiceCase } from '../cases/entities/service-case.entity';
import { CaseStatusHistory } from '../cases/entities/case-status-history.entity';
import { SearchWarrantyDto } from './dto/search-warranty.dto';
import { SearchCaseDto } from './dto/search-case.dto';
export declare class PublicService {
    private warrantiesRepository;
    private casesRepository;
    private historyRepository;
    constructor(warrantiesRepository: Repository<Warranty>, casesRepository: Repository<ServiceCase>, historyRepository: Repository<CaseStatusHistory>);
    searchWarranty(searchDto: SearchWarrantyDto): Promise<{
        warranty_id: string;
        title: string;
        sku: string;
        serial_number: string;
        device_type: string;
        purchase_date: Date;
        warranty_start: Date;
        warranty_end: Date;
        is_active: boolean;
        days_left: number;
        days_after_warranty: number;
        extended_days: number;
        service_cases_count: number;
        service_cases: {
            id: number;
            case_number: string;
            status_level: import("../cases/entities/service-case.entity").CaseStatusLevel;
            opened_at: Date;
        }[];
    }>;
    searchCase(searchDto: SearchCaseDto): Promise<{
        case_number: string;
        product_title: string;
        device_type: string;
        opened_at: Date;
        deadline_at: Date;
        status_level: import("../cases/entities/service-case.entity").CaseStatusLevel;
        result_type: import("../cases/entities/service-case.entity").ResultType;
        status_history: {
            created_at: Date;
            note_public: string;
            new_status_level: import("../cases/entities/service-case.entity").CaseStatusLevel;
            new_result: import("../cases/entities/service-case.entity").ResultType;
        }[];
        warranty_id: string;
        warranty_status: any;
        customer_name: string;
        customer_last_name: string;
        customer_initial_note: string;
        assigned_technician: {
            name: string;
            last_name: string;
        };
    }>;
}
