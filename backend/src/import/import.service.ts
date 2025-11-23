import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import { ServiceCase, CaseStatusLevel, Priority } from '../cases/entities/service-case.entity';
import { Warranty, CreatedSource } from '../warranties/entities/warranty.entity';
import { CasesService } from '../cases/cases.service';
import { WarrantiesService } from '../warranties/warranties.service';
import { CreateCaseDto } from '../cases/dto/create-case.dto';
import { CreateWarrantyDto } from '../warranties/dto/create-warranty.dto';

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(ServiceCase)
    private casesRepository: Repository<ServiceCase>,
    @InjectRepository(Warranty)
    private warrantiesRepository: Repository<Warranty>,
    private casesService: CasesService,
    private warrantiesService: WarrantiesService,
  ) {}

  async importCasesFromCSV(filePath: string, userId: number) {
    const results: any[] = [];
    const errors: any[] = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', async (row) => {
          try {
            // Map CSV row to CreateCaseDto
            const caseData: CreateCaseDto = {
              warranty_id: row.warranty_id ? parseInt(row.warranty_id) : undefined,
              sku: row.sku || '',
              imei: row.imei || undefined,
              serial_number: row.serial_number || '',
              device_type: row.device_type || 'Laptop',
              product_title: row.product_title || '',
              customer_name: row.customer_name || '',
              customer_last_name: row.customer_last_name || undefined,
              customer_phone: row.customer_phone || '',
              customer_email: row.customer_email || undefined,
              customer_initial_note: row.customer_initial_note || undefined,
              order_id: row.order_id ? parseInt(row.order_id) : undefined,
              product_id: row.product_id ? parseInt(row.product_id) : undefined,
              assigned_technician_id: row.assigned_technician_id
                ? parseInt(row.assigned_technician_id)
                : undefined,
              priority: (row.priority as Priority) || Priority.NORMAL,
              tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : undefined,
              deadline_days: row.deadline_days ? parseInt(row.deadline_days) : 14,
            };

            // Validate required fields
            if (!caseData.sku || !caseData.serial_number || !caseData.product_title || !caseData.customer_name || !caseData.customer_phone) {
              errors.push({ row, error: 'Missing required fields' });
              return;
            }

            const created = await this.casesService.create(caseData, userId);
            results.push({ row, case: created });
          } catch (error) {
            errors.push({ row, error: error.message });
          }
        })
        .on('end', () => {
          // Clean up file
          fs.unlinkSync(filePath);
          resolve({
            success: true,
            imported: results.length,
            errors: errors.length,
            details: {
              successful: results,
              failed: errors,
            },
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  async importWarrantiesFromCSV(filePath: string, userId: number) {
    const results: any[] = [];
    const errors: any[] = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', async (row) => {
          try {
            // Map CSV row to CreateWarrantyDto
            const warrantyData: CreateWarrantyDto = {
              warranty_id: row.warranty_id || undefined,
              title: row.title || '',
              sku: row.sku || '',
              imei: row.imei || undefined,
              serial_number: row.serial_number || '',
              device_type: row.device_type || 'Laptop',
              customer_name: row.customer_name || '',
              customer_last_name: row.customer_last_name || undefined,
              customer_phone: row.customer_phone || '',
              customer_email: row.customer_email || undefined,
              purchase_date: row.purchase_date ? new Date(row.purchase_date) : new Date(),
              warranty_start: row.warranty_start ? new Date(row.warranty_start) : new Date(),
              warranty_end: row.warranty_end ? new Date(row.warranty_end) : undefined,
              warranty_duration_days: row.warranty_duration_days
                ? parseInt(row.warranty_duration_days)
                : 365,
              order_id: row.order_id ? parseInt(row.order_id) : undefined,
              product_id: row.product_id ? parseInt(row.product_id) : undefined,
              created_source: row.created_source === 'woocommerce' ? CreatedSource.AUTO_WOO : CreatedSource.MANUAL,
            };

            // Validate required fields
            if (!warrantyData.title || !warrantyData.sku || !warrantyData.serial_number || !warrantyData.customer_name || !warrantyData.customer_phone) {
              errors.push({ row, error: 'Missing required fields' });
              return;
            }

            // Calculate warranty_end if not provided
            if (!warrantyData.warranty_end) {
              const start = warrantyData.warranty_start || warrantyData.purchase_date;
              warrantyData.warranty_end = new Date(start);
              warrantyData.warranty_end.setDate(
                warrantyData.warranty_end.getDate() + warrantyData.warranty_duration_days
              );
            }

            const created = await this.warrantiesService.create(warrantyData);
            results.push({ row, warranty: created });
          } catch (error) {
            errors.push({ row, error: error.message });
          }
        })
        .on('end', () => {
          // Clean up file
          fs.unlinkSync(filePath);
          resolve({
            success: true,
            imported: results.length,
            errors: errors.length,
            details: {
              successful: results,
              failed: errors,
            },
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  generateCasesExampleCSV(): string {
    const headers = [
      'sku',
      'serial_number',
      'imei',
      'device_type',
      'product_title',
      'customer_name',
      'customer_last_name',
      'customer_phone',
      'customer_email',
      'customer_initial_note',
      'warranty_id',
      'order_id',
      'product_id',
      'assigned_technician_id',
      'priority',
      'tags',
      'deadline_days',
    ];

    const exampleRow = [
      'SKU-001',
      'SN123456789',
      'IMEI123456789012345',
      'Phone',
      'iPhone 15 Pro',
      'John',
      'Doe',
      '+995555123456',
      'john.doe@example.com',
      'Screen not working',
      '',
      '12345',
      '67890',
      '',
      'normal',
      'urgent,repair',
      '14',
    ];

    return [headers.join(','), exampleRow.join(',')].join('\n');
  }

  generateWarrantiesExampleCSV(): string {
    const headers = [
      'title',
      'sku',
      'serial_number',
      'imei',
      'device_type',
      'customer_name',
      'customer_last_name',
      'customer_phone',
      'customer_email',
      'purchase_date',
      'warranty_start',
      'warranty_end',
      'warranty_duration_days',
      'order_id',
      'product_id',
      'created_source',
    ];

    const exampleRow = [
      'iPhone 15 Pro',
      'SKU-001',
      'SN123456789',
      'IMEI123456789012345',
      'Phone',
      'John',
      'Doe',
      '+995555123456',
      'john.doe@example.com',
      '2024-01-15',
      '2024-01-15',
      '2025-01-15',
      '365',
      '12345',
      '67890',
      'manual',
    ];

    return [headers.join(','), exampleRow.join(',')].join('\n');
  }
}

