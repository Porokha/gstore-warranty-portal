import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { ServiceCase, CaseStatusLevel, Priority } from '../cases/entities/service-case.entity';
import { Warranty, CreatedSource } from '../warranties/entities/warranty.entity';
import { CasesService } from '../cases/cases.service';
import { WarrantiesService } from '../warranties/warranties.service';
import { CreateCaseDto } from '../cases/dto/create-case.dto';
import { CreateWarrantyDto } from '../warranties/dto/create-warranty.dto';

export interface ImportProgressState {
  total: number;
  processed: number;
  imported: number;
  skipped: number;
  errors: number;
  status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled' | 'not_found';
  message?: string;
  error?: string;
  result?: any;
  cancelRequested?: boolean;
}

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);
  private importProgress: Map<string, ImportProgressState> = new Map();

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

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const csvParser = require('csv-parser');
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
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

  async importWarrantiesFromCSV(filePath: string, userId: number, jobId?: string) {
    this.logger.log(`=== Starting warranty CSV import from: ${filePath} ===`);
    const results: any[] = [];
    const errors: any[] = [];
    const skipped: any[] = [];
    const rows: any[] = [];
    
    // Initialize progress if jobId provided
    if (jobId) {
      this.importProgress.set(jobId, {
        total: 0,
        processed: 0,
        imported: 0,
        skipped: 0,
        errors: 0,
        status: 'pending',
      });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      this.logger.error(`File not found: ${filePath}`);
      throw new BadRequestException(`File not found: ${filePath}`);
    }

    this.logger.log(`File exists, starting CSV parsing...`);

    // First, read all rows into memory
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const csvParser = require('csv-parser');
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser({
          skipEmptyLines: true,
          skipLinesWithError: false,
          mapHeaders: ({ header }) => {
            // Remove BOM and trim whitespace from headers
            return header.replace(/^\ufeff/, '').trim();
          }
        }))
        .on('data', (row) => {
          rows.push(row);
        })
        .on('end', async () => {
          this.logger.log(`CSV parsing complete. Found ${rows.length} rows.`);
          
          // Update progress with total
          if (jobId) {
            const progress = this.importProgress.get(jobId);
            if (progress) {
              progress.total = rows.length;
              progress.status = 'running';
              this.importProgress.set(jobId, progress);
            }
          }
          
          if (rows.length === 0) {
            this.logger.error(`No rows found in CSV file!`);
            if (jobId) {
              const progress = this.importProgress.get(jobId);
              if (progress) {
                progress.status = 'error';
                progress.error = 'No rows found in CSV file';
                this.importProgress.set(jobId, progress);
              }
            }
            resolve({
              success: false,
              imported: 0,
              skipped: 0,
              errors: 0,
              details: {
                successful: [],
                skipped: [],
                failed: [{ error: 'No rows found in CSV file' }],
              },
            });
            return;
          }
          
          this.logger.log(`Processing ${rows.length} warranty rows from CSV`);
          
          // Log first row structure for debugging
          this.logger.log(`First row sample (keys): ${Object.keys(rows[0]).join(', ')}`);
          this.logger.log(`First row data: ${JSON.stringify(rows[0]).substring(0, 500)}`);
          
          // Process rows sequentially to avoid race conditions
          let processedCount = 0;
          for (const rawRow of rows) {
            // Check for cancellation
            if (jobId) {
              const progress = this.importProgress.get(jobId);
              if (progress?.cancelRequested) {
                this.logger.log(`Import cancelled by user`);
                progress.status = 'cancelled';
                this.importProgress.set(jobId, progress);
                resolve({
                  success: false,
                  imported: results.length,
                  skipped: skipped.length,
                  errors: errors.length,
                  details: { successful: results, skipped, failed: errors },
                });
                return;
              }
            }
            
            processedCount++;
            if (processedCount % 1000 === 0) {
              this.logger.log(`Processed ${processedCount}/${rows.length} rows... (${results.length} imported, ${errors.length} errors)`);
            }
            
            // Update progress every 100 rows
            if (jobId && processedCount % 100 === 0) {
              const progress = this.importProgress.get(jobId);
              if (progress) {
                progress.processed = processedCount;
                progress.imported = results.length;
                progress.skipped = skipped.length;
                progress.errors = errors.length;
                this.importProgress.set(jobId, progress);
              }
            }
            
            // Normalize row keys - remove BOM, trim whitespace, handle case sensitivity
            const row: any = {};
            for (const key in rawRow) {
              if (rawRow.hasOwnProperty(key)) {
                // Remove BOM (Byte Order Mark) and trim whitespace
                const normalizedKey = key.replace(/^\ufeff/, '').trim();
                row[normalizedKey] = rawRow[key];
              }
            }
            
            // Debug: Log first row's actual keys vs normalized keys
            if (processedCount === 1) {
              this.logger.log(`Raw row keys: ${Object.keys(rawRow).join(', ')}`);
              this.logger.log(`Normalized row keys: ${Object.keys(row).join(', ')}`);
              this.logger.log(`title value: "${row.title}" (type: ${typeof row.title})`);
            }
            
            try {
              
              // Map CSV row to CreateWarrantyDto
              // Use imei as serial_number for phones if serial_number is empty
              let serialNumber = row.serial_number || row.imei || '';
              
              // If serial_number is still empty, generate one from available data
              if (!serialNumber) {
                if (row.order_id && row.product_id) {
                  serialNumber = `ORDER-${row.order_id}-PROD-${row.product_id}`;
                } else if (row.order_id) {
                  serialNumber = `ORDER-${row.order_id}`;
                } else {
                  // Generate from title + customer + timestamp for uniqueness
                  const hash = `${row.title || 'UNKNOWN'}-${row.customer_phone || 'NO-PHONE'}-${processedCount}`.substring(0, 50).replace(/\s+/g, '-');
                  serialNumber = `IMPORT-${hash}`;
                }
              }
              
              // Generate SKU from available data if SKU is empty
              let sku = row.sku || '';
              if (!sku) {
                if (row.order_id && row.product_id) {
                  sku = `ORDER-${row.order_id}-${row.product_id}`;
                } else if (row.order_id) {
                  sku = `ORDER-${row.order_id}`;
                } else if (serialNumber) {
                  sku = `SN-${serialNumber.substring(0, 30)}`;
                } else {
                  // Last resort: use a hash of title + customer to make it somewhat stable
                  const hash = (row.title + row.customer_name + row.customer_phone).substring(0, 20).replace(/\s+/g, '-');
                  sku = `IMPORT-${hash}`;
                }
              }
              
              const warrantyData: any = {
                title: row.title || '',
                sku: sku,
                imei: row.imei || undefined,
                serial_number: serialNumber,
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
                const errorMsg = `Invalid date format: ${dateError.message}`;
                if (errors.length < 3) {
                  this.logger.error(`Date parsing error (row ${errors.length + 1}): ${errorMsg}`);
                  this.logger.error(`Row data: ${JSON.stringify(row).substring(0, 300)}`);
                }
                errors.push({ row, error: errorMsg });
                continue;
              }

              // Validate required fields
              if (!warrantyData.title || !warrantyData.sku || !warrantyData.serial_number || !warrantyData.customer_name || !warrantyData.customer_phone) {
                const errorMsg = 'Missing required fields (title, sku, serial_number, customer_name, customer_phone)';
                if (errors.length < 3) {
                  this.logger.error(`Validation error (row ${errors.length + 1}): ${errorMsg}`);
                  this.logger.error(`Row data: title=${row.title}, sku=${row.sku}, serial_number=${row.serial_number}, customer_name=${row.customer_name}, customer_phone=${row.customer_phone}`);
                }
                errors.push({ row, error: errorMsg });
                continue;
              }

              // Validate dates are valid
              if (isNaN(new Date(warrantyData.purchase_date).getTime()) || 
                  isNaN(new Date(warrantyData.warranty_start).getTime()) || 
                  isNaN(new Date(warrantyData.warranty_end).getTime())) {
                const errorMsg = 'Invalid date values';
                if (errors.length < 3) {
                  this.logger.error(`Date validation error (row ${errors.length + 1}): ${errorMsg}`);
                  this.logger.error(`Dates: purchase_date=${warrantyData.purchase_date}, warranty_start=${warrantyData.warranty_start}, warranty_end=${warrantyData.warranty_end}`);
                }
                errors.push({ row, error: errorMsg });
                continue;
              }

              // Check for duplicates - ONLY by order_id (if provided)
              // Same person, same product, same date can be different warranties
              // Duplicates only if order_id matches
              if (warrantyData.order_id) {
                const existingWarranty = await this.warrantiesRepository.findOne({
                  where: { order_id: warrantyData.order_id },
                });

                if (existingWarranty) {
                  skipped.push({ row, reason: `Duplicate warranty found: Order ID ${warrantyData.order_id} already exists` });
                  continue;
                }
              }

              // Log first warranty data for debugging
              if (results.length === 0 && errors.length === 0) {
                this.logger.log(`Sample warranty data being created:`, JSON.stringify(warrantyData, null, 2).substring(0, 500));
              }

              const created = await this.warrantiesService.create(warrantyData);
              results.push({ row, warranty: created });
            } catch (error) {
              const errorMessage = error.message || 'Unknown error';
              const errorStack = error.stack || '';
              
              // Log detailed error for first few errors
              if (errors.length < 3) {
                this.logger.error(`Error processing warranty row ${errors.length + 1}:`, errorMessage);
                this.logger.error(`Row data:`, JSON.stringify(row).substring(0, 300));
                if (errorStack) {
                  this.logger.error(`Stack:`, errorStack.substring(0, 500));
                }
              }
              
              // Check if it's a duplicate error
              if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
                skipped.push({ row, reason: errorMessage });
              } else {
                // Include validation errors if available
                let fullError = errorMessage;
                if (error.response?.message) {
                  if (Array.isArray(error.response.message)) {
                    fullError = error.response.message.join('; ');
                  } else {
                    fullError = error.response.message;
                  }
                }
                errors.push({ row, error: fullError });
              }
            }
          }

          this.logger.log(`Import complete: ${results.length} imported, ${skipped.length} skipped, ${errors.length} errors`);

          // Update final progress
          if (jobId) {
            const progress = this.importProgress.get(jobId);
            if (progress) {
              progress.processed = rows.length;
              progress.imported = results.length;
              progress.skipped = skipped.length;
              progress.errors = errors.length;
              progress.status = 'completed';
              progress.result = {
                imported: results.length,
                skipped: skipped.length,
                errors: errors.length,
                details: {
                  successful: results,
                  skipped,
                  failed: errors,
                },
              };
              this.importProgress.set(jobId, progress);
            }
          }

          // Log sample errors to help debug
          if (errors.length > 0) {
            this.logger.error(`First 5 errors:`);
            errors.slice(0, 5).forEach((err, idx) => {
              this.logger.error(`Error ${idx + 1}: ${err.error}`);
              this.logger.error(`Row data: ${JSON.stringify(err.row).substring(0, 200)}...`);
            });

            // Count error types
            const errorTypes: { [key: string]: number } = {};
            errors.forEach(err => {
              const errorMsg = err.error || 'Unknown error';
              const errorType = errorMsg.split(':')[0].split('(')[0].trim();
              errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
            });
            this.logger.error(`Error summary: ${JSON.stringify(errorTypes)}`);
          }

          // Clean up file
          try {
            fs.unlinkSync(filePath);
          } catch (unlinkError) {
            console.error('Failed to delete temp file:', unlinkError);
          }

          const result = {
            success: true,
            imported: results.length,
            skipped: skipped.length,
            errors: errors.length,
            details: {
              successful: results,
              skipped,
              failed: errors,
            },
          };
          
          // If no jobId, return result directly (synchronous mode)
          if (!jobId) {
            resolve(result);
          } else {
            // Async mode - result already stored in progress
            resolve(result);
          }
        })
        .on('error', (error) => {
          this.logger.error('Error reading CSV file:', error);
          if (jobId) {
            const progress = this.importProgress.get(jobId);
            if (progress) {
              progress.status = 'error';
              progress.error = error.message;
              this.importProgress.set(jobId, progress);
            }
          }
          reject(error);
        });
    }).catch((error) => {
      this.logger.error('Error in importWarrantiesFromCSV:', error);
      if (jobId) {
        const progress = this.importProgress.get(jobId);
        if (progress) {
          progress.status = 'error';
          progress.error = error.message;
          this.importProgress.set(jobId, progress);
        }
      }
      throw error;
    });
  }

  getImportProgress(jobId: string): ImportProgressState | null {
    const progress = this.importProgress.get(jobId);
    if (!progress) {
      return {
        total: 0,
        processed: 0,
        imported: 0,
        skipped: 0,
        errors: 0,
        status: 'not_found' as any,
      };
    }
    return progress;
  }

  cancelImport(jobId: string): { success: boolean; message: string } {
    const progress = this.importProgress.get(jobId);
    if (!progress) {
      return { success: false, message: 'Import job not found' };
    }
    if (progress.status === 'completed' || progress.status === 'error' || progress.status === 'cancelled') {
      return { success: false, message: `Import is already ${progress.status}` };
    }
    progress.cancelRequested = true;
    this.importProgress.set(jobId, progress);
    return { success: true, message: 'Import cancellation requested' };
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

