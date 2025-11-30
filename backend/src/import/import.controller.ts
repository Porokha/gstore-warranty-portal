import {
  Controller,
  Post,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ImportService } from './import.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// Multer file type - using any to avoid type issues
type MulterFile = any;

@Controller('import')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ImportController {
  private readonly logger = new Logger(ImportController.name);

  constructor(private importService: ImportService) {
    // Ensure uploads/imports directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads', 'imports');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      this.logger.log(`Created uploads directory: ${uploadsDir}`);
    }
  }

  @Post('cases/csv')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadsDir = path.join(process.cwd(), 'uploads', 'imports');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          cb(null, uploadsDir);
        },
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          cb(null, `cases_${timestamp}_${file.originalname}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
          cb(null, true);
        } else {
          cb(new Error('Only CSV files are allowed'), false);
        }
      },
    }),
  )
  async importCases(
    @UploadedFile() file: MulterFile,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.importService.importCasesFromCSV((file as any).path, user.id);
  }

  @Post('warranties/csv')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadsDir = path.join(process.cwd(), 'uploads', 'imports');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          cb(null, uploadsDir);
        },
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          cb(null, `warranties_${timestamp}_${file.originalname}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
          cb(null, true);
        } else {
          cb(new Error('Only CSV files are allowed'), false);
        }
      },
    }),
  )
  async importWarranties(
    @UploadedFile() file: MulterFile,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    try {
      this.logger.log(`Importing warranties from CSV: ${(file as any).path}`);
      
      // Generate job ID for progress tracking
      const jobId = `csv-import-${Date.now()}`;
      
      // Process import asynchronously
      this.importService.importWarrantiesFromCSV((file as any).path, user.id, jobId)
        .then((result: any) => {
          this.logger.log(`Import complete: ${result.imported} imported, ${result.skipped} skipped, ${result.errors} errors`);
        })
        .catch((error) => {
          this.logger.error('Error importing warranties from CSV:', error);
        });
      
      return {
        success: true,
        jobId,
        message: 'Import started. Use the progress endpoint to track status.',
      };
    } catch (error) {
      this.logger.error('Error importing warranties from CSV:', error);
      this.logger.error('Error stack:', (error as any).stack);
      throw error;
    }
  }

  @Get('warranties/csv/progress/:jobId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getImportProgress(@Param('jobId') jobId: string) {
    return this.importService.getImportProgress(jobId);
  }

  @Post('warranties/csv/cancel/:jobId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  cancelImport(@Param('jobId') jobId: string) {
    return this.importService.cancelImport(jobId);
  }

  @Get('cases/csv/example')
  async downloadCasesExample(@Res() res: Response) {
    const csv = this.importService.generateCasesExampleCSV();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=cases-example.csv');
    res.send(csv);
  }

  @Get('warranties/csv/example')
  async downloadWarrantiesExample(@Res() res: Response) {
    const csv = this.importService.generateWarrantiesExampleCSV();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=warranties-example.csv');
    res.send(csv);
  }
}

