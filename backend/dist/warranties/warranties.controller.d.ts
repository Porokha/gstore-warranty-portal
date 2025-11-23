import { WarrantiesService } from './warranties.service';
import { CreateWarrantyDto } from './dto/create-warranty.dto';
import { UpdateWarrantyDto } from './dto/update-warranty.dto';
import { FilterWarrantyDto } from './dto/filter-warranty.dto';
export declare class WarrantiesController {
    private warrantiesService;
    constructor(warrantiesService: WarrantiesService);
    create(createDto: CreateWarrantyDto): Promise<import("./entities/warranty.entity").Warranty>;
    findAll(filters: FilterWarrantyDto): Promise<import("./entities/warranty.entity").Warranty[]>;
    getStats(startDate?: string, endDate?: string): Promise<{
        total: number;
        active: number;
        expired: number;
        expiringSoon: number;
    }>;
    findByWarrantyId(warrantyId: string): Promise<import("./entities/warranty.entity").Warranty>;
    findOne(id: number): Promise<import("./entities/warranty.entity").Warranty>;
    update(id: number, updateDto: UpdateWarrantyDto): Promise<import("./entities/warranty.entity").Warranty>;
    extendWarranty(id: number, days: number): Promise<import("./entities/warranty.entity").Warranty>;
    remove(id: number, req: any): Promise<void>;
}
