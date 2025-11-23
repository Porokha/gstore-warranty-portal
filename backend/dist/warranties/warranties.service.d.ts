import { Repository } from 'typeorm';
import { Warranty, CreatedSource } from './entities/warranty.entity';
import { CreateWarrantyDto } from './dto/create-warranty.dto';
import { UpdateWarrantyDto } from './dto/update-warranty.dto';
import { FilterWarrantyDto } from './dto/filter-warranty.dto';
import { AuditService } from '../audit/audit.service';
export declare class WarrantiesService {
    private warrantiesRepository;
    private auditService;
    constructor(warrantiesRepository: Repository<Warranty>, auditService: AuditService);
    generateWarrantyId(createdSource?: CreatedSource, orderId?: number, productId?: number): Promise<string>;
    create(createDto: CreateWarrantyDto): Promise<Warranty>;
    findAll(filters?: FilterWarrantyDto): Promise<Warranty[]>;
    findOne(id: number): Promise<Warranty>;
    findByWarrantyId(warrantyId: string): Promise<Warranty>;
    update(id: number, updateDto: UpdateWarrantyDto): Promise<Warranty>;
    extendWarranty(id: number, days: number): Promise<Warranty>;
    remove(id: number, deletedBy: number): Promise<void>;
    getStats(startDate?: Date, endDate?: Date): Promise<{
        total: number;
        active: number;
        expired: number;
        expiringSoon: number;
    }>;
}
