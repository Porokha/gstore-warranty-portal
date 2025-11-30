import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import csv from 'csv-parser';
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
    const skipped: any[] = [];

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

            // Check for duplicates - by serial_number and order_id if provided
            const existingCase = await this.casesRepository.findOne({
              where: [
                { serial_number: caseData.serial_number, order_id: caseData.order_id || null },
                ...(caseData.order_id ? [{ order_id: caseData.order_id }] : []),
              ],
            });

            if (existingCase) {
              skipped.push({ row, reason: 'Duplicate case found' });
              return;
            }

            const created = await this.casesService.create(caseData, userId);
            results.push({ row, case: created });
          } catch (error) {
            // Check if it's a duplicate error
            if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
              skipped.push({ row, reason: error.message });
            } else {
              errors.push({ row, error: error.message });
            }
          }
        })
        .on('end', () => {
          // Clean up file
          fs.unlinkSync(filePath);
          resolve({
            success: true,
            imported: results.length,
            skipped: skipped.length,
            errors: errors.length,
            details: {
              successful: results,
              skipped,
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
    const skipped: any[] = [];
    const rows: any[] = [];

    // First, read all rows into memory
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rows.push(row);
        })
        .on('end', async () => {
          // Process rows sequentially to avoid race conditions
          for (const row of rows) {
            try {
              // Map CSV row to CreateWarrantyDto
              const warrantyData: any = {
                title: row.title || '',
                sku: row.sku || '',
                imei: row.imei || undefined,
                serial_number: row.serial_number || '',
                device_type: row.device_type || 'Laptop',
                customer_name: row.customer_name || '',
                customer_last_name: row.customer_last_name || '', // Required field, default to empty string
                customer_phone: row.customer_phone || '',
                customer_email: row.customer_email || undefined,
                price: row.price ? parseFloat(row.price) : 0,
                thumbnail_url: row.thumbnail_url || undefined,
                // Admin-only fields
                brand: row.brand || undefined,
                model: row.model || undefined,
                condition: row.condition || undefined,
                personal_identification_number: row.personal_identification_number || row.pn || undefined,
                admin_notes: row.admin_notes || undefined,
                extended_days: row.extended_days ? parseInt(row.extended_days) : 0,
                order_id: row.order_id ? parseInt(row.order_id) : undefined,
                product_id: row.product_id ? parseInt(row.product_id) : undefined,
                order_line_index: row.order_line_index ? parseInt(row.order_line_index) : undefined,
                created_source: row.created_source === 'woocommerce' || row.created_source === 'auto_woo' ? CreatedSource.AUTO_WOO : CreatedSource.MANUAL,
              };

              // Parse dates with validation
              try {
                warrantyData.purchase_date = row.purchase_date 
                  ? new Date(row.purchase_date).toISOString() 
                  : new Date().toISOString();
                
                warrantyData.warranty_start = row.warranty_start 
                  ? new Date(row.warranty_start).toISOString() 
                  : warrantyData.purchase_date;
                
                if (row.warranty_end) {
                  warrantyData.warranty_end = new Date(row.warranty_end).toISOString();
                } else {
                  // Calculate warranty_end if not provided
                  const start = new Date(warrantyData.warranty_start || warrantyData.purchase_date);
                  const durationDays = row.warranty_duration_days ? parseInt(row.warranty_duration_days) : 365;
                  const endDate = new Date(start);
                  endDate.setDate(endDate.getDate() + durationDays);
                  warrantyData.warranty_end = endDate.toISOString();
                }
              } catch (dateError) {
                errors.push({ row, error: `Invalid date format: ${dateError.message}` });
                continue;
              }

              // Validate required fields
              if (!warrantyData.title || !warrantyData.sku || !warrantyData.serial_number || !warrantyData.customer_name || !warrantyData.customer_phone) {
                errors.push({ row, error: 'Missing required fields (title, sku, serial_number, customer_name, customer_phone)' });
                continue;
              }

              // Validate dates are valid
              if (isNaN(new Date(warrantyData.purchase_date).getTime()) || 
                  isNaN(new Date(warrantyData.warranty_start).getTime()) || 
                  isNaN(new Date(warrantyData.warranty_end).getTime())) {
                errors.push({ row, error: 'Invalid date values' });
                continue;
              }

              // Check for duplicates - by serial_number and order_id if provided
              const existingWarranty = await this.warrantiesRepository.findOne({
                where: [
                  { serial_number: warrantyData.serial_number, order_id: warrantyData.order_id || null },
                  ...(warrantyData.order_id ? [{ order_id: warrantyData.order_id }] : []),
                ],
              });

              if (existingWarranty) {
                skipped.push({ row, reason: 'Duplicate warranty found' });
                continue;
              }

              const created = await this.warrantiesService.create(warrantyData);
              results.push({ row, warranty: created });
            } catch (error) {
              // Check if it's a duplicate error
              if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
                skipped.push({ row, reason: error.message });
              } else {
                errors.push({ row, error: error.message || 'Unknown error' });
              }
            }
          }

          // Clean up file
          try {
            fs.unlinkSync(filePath);
          } catch (unlinkError) {
            console.error('Failed to delete temp file:', unlinkError);
          }

          resolve({
            success: true,
            imported: results.length,
            skipped: skipped.length,
            errors: errors.length,
            details: {
              successful: results,
              skipped,
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
      'order_line_index',
      'created_source',
      'price',
      'thumbnail_url',
      'brand',
      'model',
      'condition',
      'personal_identification_number',
      'admin_notes',
      'extended_days',
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
      '0',
      'manual',
      '999.99',
      'https://example.com/image.jpg',
      'Apple',
      'iPhone 15 Pro',
      'New',
      'PN-12345',
      'Internal note for admin',
      '0',
    ];

    return [headers.join(','), exampleRow.join(',')].join('\n');
  }
}

