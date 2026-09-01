import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Like, Between, In } from 'typeorm';
import { Warranty, CreatedSource } from './entities/warranty.entity';
import { CreateWarrantyDto } from './dto/create-warranty.dto';
import { UpdateWarrantyDto } from './dto/update-warranty.dto';
import { FilterWarrantyDto } from './dto/filter-warranty.dto';
import { AuditService } from '../audit/audit.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class WarrantiesService {
  constructor(
    @InjectRepository(Warranty)
    private warrantiesRepository: Repository<Warranty>,
    private auditService: AuditService,
    private smsService: SmsService,
  ) {}

  async generateWarrantyId(
    createdSource: CreatedSource = CreatedSource.MANUAL,
    orderId?: number,
    productId?: number,
  ): Promise<string> {
    const prefix = createdSource === CreatedSource.AUTO_WOO ? 'WP' : 'MN';
    
    // For WooCommerce orders, use order ID and product ID if provided
    if (createdSource === CreatedSource.AUTO_WOO && orderId && productId) {
      return `${prefix}-${orderId}-${productId}`;
    }
    
    // Otherwise, use sequential numbering
    const lastWarranty = await this.warrantiesRepository.findOne({
      where: { created_source: createdSource },
      order: { id: 'DESC' },
    });

    let nextNumber = 1;
    if (lastWarranty && lastWarranty.warranty_id) {
      const match = lastWarranty.warranty_id.match(new RegExp(`${prefix}-(\\d+)`));
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `${prefix}-${nextNumber.toString().padStart(4, '0')}-${Date.now().toString().slice(-4)}`;
  }

  async create(createDto: CreateWarrantyDto): Promise<Warranty> {
    // Generate warranty_id if not provided
    const warrantyId = await this.generateWarrantyId(
      createDto.created_source || CreatedSource.MANUAL
    );

    const warranty = this.warrantiesRepository.create({
      ...createDto,
      warranty_id: warrantyId,
      purchase_date: new Date(createDto.purchase_date),
      warranty_start: new Date(createDto.warranty_start),
      warranty_end: new Date(createDto.warranty_end),
      created_source: createDto.created_source || CreatedSource.MANUAL,
      extended_days: createDto.extended_days || 0,
    });

    const savedWarranty = await this.warrantiesRepository.save(warranty);

    try {
      await this.smsService.notifyWarrantyCreated(savedWarranty);
    } catch (error) {
      console.error('Failed to send warranty created SMS:', error);
    }

    return savedWarranty;
  }

  async findAll(filters?: FilterWarrantyDto): Promise<Warranty[] | { data: Warranty[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.warrantiesRepository.createQueryBuilder('warranty');

    if (filters) {
      // Search across multiple fields
      if (filters.search) {
        queryBuilder.andWhere(
          `(
            warranty.warranty_id LIKE :search
            OR warranty.sku LIKE :search
            OR warranty.serial_number LIKE :search
            OR warranty.title LIKE :search
            OR warranty.customer_name LIKE :search
            OR warranty.customer_last_name LIKE :search
            OR warranty.customer_phone LIKE :search
            OR warranty.personal_identification_number LIKE :search
            OR warranty.customer_email LIKE :search
            OR warranty.imei LIKE :search
          )`,
          { search: `%${filters.search}%` }
        );
      }

      if (filters.sku) {
        queryBuilder.andWhere('warranty.sku = :sku', { sku: filters.sku });
      }

      if (filters.serial_number) {
        queryBuilder.andWhere('warranty.serial_number = :serial_number', {
          serial_number: filters.serial_number,
        });
      }

      if (filters.imei) {
        queryBuilder.andWhere('warranty.imei = :imei', { imei: filters.imei });
      }

      if (filters.device_type) {
        queryBuilder.andWhere('warranty.device_type = :device_type', {
          device_type: filters.device_type,
        });
      }

      if (filters.customer_phone) {
        queryBuilder.andWhere('warranty.customer_phone = :customer_phone', {
          customer_phone: filters.customer_phone,
        });
      }

      if (filters.customer_name) {
        queryBuilder.andWhere(
          '(warranty.customer_name LIKE :customer_name OR warranty.customer_last_name LIKE :customer_name)',
          { customer_name: `%${filters.customer_name}%` }
        );
      }

      if (filters.order_id) {
        queryBuilder.andWhere('warranty.order_id = :order_id', {
          order_id: filters.order_id,
        });
      }

      if (filters.product_id) {
        queryBuilder.andWhere('warranty.product_id = :product_id', {
          product_id: filters.product_id,
        });
      }

      const now = new Date();

      if (filters.active_only) {
        queryBuilder.andWhere('warranty.warranty_end >= :now', { now });
      }

      if (filters.expired_only) {
        queryBuilder.andWhere('warranty.warranty_end < :now', { now });
      }

      if (filters.purchase_date_from) {
        queryBuilder.andWhere('warranty.purchase_date >= :purchase_date_from', {
          purchase_date_from: new Date(filters.purchase_date_from),
        });
      }

      if (filters.purchase_date_to) {
        queryBuilder.andWhere('warranty.purchase_date <= :purchase_date_to', {
          purchase_date_to: new Date(filters.purchase_date_to),
        });
      }

      if (filters.warranty_end_from) {
        queryBuilder.andWhere('warranty.warranty_end >= :warranty_end_from', {
          warranty_end_from: new Date(filters.warranty_end_from),
        });
      }

      if (filters.warranty_end_to) {
        queryBuilder.andWhere('warranty.warranty_end <= :warranty_end_to', {
          warranty_end_to: new Date(filters.warranty_end_to),
        });
      }
    }

    queryBuilder.orderBy('warranty.created_at', 'DESC');

    const hasPagination = filters?.page !== undefined && filters?.limit !== undefined;
    const page = Math.max(1, Number(filters?.page) || 1);
    const limit = Math.min(250, Math.max(1, Number(filters?.limit) || 50));

    if (hasPagination) {
      const [data, total] = await queryBuilder
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return { data, total, page, limit };
    }

    return queryBuilder.getMany();
  }

  async findOne(id: number): Promise<Warranty> {
    const warranty = await this.warrantiesRepository.findOne({
      where: { id },
      relations: ['service_cases'],
    });

    if (!warranty) {
      throw new NotFoundException(`Warranty with ID ${id} not found`);
    }

    return warranty;
  }

  async findByWarrantyId(warrantyId: string): Promise<Warranty> {
    const warranty = await this.warrantiesRepository.findOne({
      where: { warranty_id: warrantyId },
      relations: ['service_cases'],
    });

    if (!warranty) {
      throw new NotFoundException(`Warranty with ID ${warrantyId} not found`);
    }

    return warranty;
  }

  async update(id: number, updateDto: UpdateWarrantyDto): Promise<Warranty> {
    const warranty = await this.findOne(id);

    // Convert date strings to Date objects if provided
    const updateData: any = { ...updateDto };
    if (updateDto.purchase_date) {
      updateData.purchase_date = new Date(updateDto.purchase_date);
    }
    if (updateDto.warranty_start) {
      updateData.warranty_start = new Date(updateDto.warranty_start);
    }
    if (updateDto.warranty_end) {
      updateData.warranty_end = new Date(updateDto.warranty_end);
    }

    Object.assign(warranty, updateData);
    return this.warrantiesRepository.save(warranty);
  }

  async extendWarranty(id: number, days: number): Promise<Warranty> {
    const warranty = await this.findOne(id);

    if (days <= 0) {
      throw new BadRequestException('Extension days must be positive');
    }

    warranty.extended_days += days;
    warranty.warranty_end = new Date(
      new Date(warranty.warranty_end).getTime() + days * 24 * 60 * 60 * 1000
    );

    return this.warrantiesRepository.save(warranty);
  }

  async resendWarrantyCreatedSms(id: number): Promise<{ success: boolean; message: string; log_id?: number }> {
    const warranty = await this.findOne(id);

    if (!warranty.customer_phone) {
      throw new BadRequestException('Warranty has no customer phone number');
    }

    const log = await this.smsService.notifyWarrantyCreated(warranty);

    if (!log) {
      return {
        success: false,
        message: 'Warranty SMS was not sent. Check SMS settings and warranty phone number.',
      };
    }

    return {
      success: log.status === 'sent',
      message: log.status === 'sent' ? 'Warranty SMS resent successfully' : log.api_response || 'Warranty SMS failed',
      log_id: log.id,
    };
  }

  async remove(id: number, deletedBy: number): Promise<void> {
    const warranty = await this.findOne(id);
    
    // Check if warranty has associated service cases
    if (warranty.service_cases && warranty.service_cases.length > 0) {
      throw new BadRequestException(
        'Cannot delete warranty with associated service cases'
      );
    }

    // Log deletion in audit before removing
    await this.auditService.log(deletedBy, 'warranty.deleted', {
      warranty_id: warranty.id,
      warranty_number: warranty.warranty_id,
      customer_name: warranty.customer_name,
      customer_last_name: warranty.customer_last_name,
      customer_phone: warranty.customer_phone,
      product_title: warranty.title,
      sku: warranty.sku,
      serial_number: warranty.serial_number,
      deleted_at: new Date().toISOString(),
    });

    await this.warrantiesRepository.remove(warranty);
  }

  async bulkRemove(ids: number[], deletedBy: number): Promise<{ deleted: number; failed: number; errors: string[] }> {
    const result = { deleted: 0, failed: 0, errors: [] as string[] };
    
    for (const id of ids) {
      try {
        const warranty = await this.findOne(id);
        
        // Check if warranty has associated service cases
        if (warranty.service_cases && warranty.service_cases.length > 0) {
          result.failed++;
          result.errors.push(`Warranty ${warranty.warranty_id} has associated service cases`);
          continue;
        }

        // Log deletion in audit before removing
        await this.auditService.log(deletedBy, 'warranty.deleted', {
          warranty_id: warranty.id,
          warranty_number: warranty.warranty_id,
          customer_name: warranty.customer_name,
          customer_last_name: warranty.customer_last_name,
          customer_phone: warranty.customer_phone,
          product_title: warranty.title,
          sku: warranty.sku,
          serial_number: warranty.serial_number,
          deleted_at: new Date().toISOString(),
        });

        await this.warrantiesRepository.remove(warranty);
        result.deleted++;
      } catch (error) {
        result.failed++;
        result.errors.push(`Failed to delete warranty ID ${id}: ${error.message}`);
      }
    }
    
    return result;
  }

  async getStats(startDate?: Date, endDate?: Date) {
    const queryBuilder = this.warrantiesRepository.createQueryBuilder('warranty');
    
    const now = new Date();

    // Active warranties
    const activeCount = await this.warrantiesRepository.count({
      where: {
        warranty_end: MoreThan(now),
      },
    });

    // Expired warranties
    const expiredCount = await this.warrantiesRepository.count({
      where: {
        warranty_end: LessThan(now),
      },
    });

    // Total warranties
    const totalCount = await this.warrantiesRepository.count();

    // Warranties expiring soon (within 30 days)
    const expiringSoonDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringSoonCount = await this.warrantiesRepository.count({
      where: {
        warranty_end: Between(now, expiringSoonDate),
      },
    });

    return {
      total: totalCount,
      active: activeCount,
      expired: expiredCount,
      expiringSoon: expiringSoonCount,
    };
  }

  async getUniqueDeviceTypes(): Promise<string[]> {
    const results = await this.warrantiesRepository
      .createQueryBuilder('warranty')
      .select('DISTINCT warranty.device_type', 'device_type')
      .where('warranty.device_type IS NOT NULL')
      .andWhere('warranty.device_type != ""')
      .orderBy('warranty.device_type', 'ASC')
      .getRawMany();

    return results.map((r) => r.device_type).filter(Boolean);
  }
}
