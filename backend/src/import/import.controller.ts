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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Response } from 'express';
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
  constructor(private importService: ImportService) {}

  @Post('cases/csv')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'uploads/imports',
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
        destination: 'uploads/imports',
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
    return this.importService.importWarrantiesFromCSV((file as any).path, user.id);
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

