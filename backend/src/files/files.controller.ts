import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Res,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { promises as fs } from 'fs';
import { isAllowedUpload, hasValidUploadSignature, uploadExtension } from './upload-validation';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FilesService } from './files.service';
import { ServiceCase } from '../cases/entities/service-case.entity';

// Multer file type - using any to avoid type issues
type MulterFile = any;

@Controller('files')
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post('cases/:caseId/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const caseId = req.params.caseId;
          if (!/^[1-9]\d*$/.test(caseId)) {
            cb(new BadRequestException('Invalid case ID'), '');
            return;
          }
          const uploadPath = `uploads/cases/${caseId}`;
          const fs = require('fs');
          const path = require('path');
          const dir = path.join(process.cwd(), uploadPath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 15);
          const ext = uploadExtension(file.originalname);
          cb(null, `${timestamp}_${randomStr}${ext}`);
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
      fileFilter: (req, file, cb) => {
        if (isAllowedUpload(file.originalname, file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type'), false);
        }
      },
    }),
  )
  async uploadFile(
    @Param('caseId', ParseIntPipe) caseId: number,
    @UploadedFile() file: MulterFile,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    try {
      const handle = await fs.open(file.path, 'r');
      const bytes = Buffer.alloc(16);
      try {
        await handle.read(bytes, 0, bytes.length, 0);
      } finally {
        await handle.close();
      }
      if (!hasValidUploadSignature(uploadExtension(file.filename), bytes)) {
        throw new BadRequestException('File content does not match its type');
      }
      return await this.filesService.uploadFile(caseId, file, user.id);
    } catch (error) {
      await fs.unlink(file.path).catch(() => undefined);
      throw error;
    }
  }

  @Get('cases/:caseId')
  @UseGuards(JwtAuthGuard)
  findAllByCase(@Param('caseId', ParseIntPipe) caseId: number) {
    return this.filesService.findAllByCase(caseId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.filesService.findOne(id);
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard)
  async downloadFile(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const file = await this.filesService.findOne(id);
    const filePath = this.filesService.getFilePath(file.file_url);
    
    return res.sendFile(filePath, {
      root: process.cwd(),
    });
  }

  @Get(':id/public-download')
  async publicDownloadFile(
    @Param('id', ParseIntPipe) id: number,
    @Query('case_number') caseNumber?: string,
    @Query('phone') phone?: string,
    @Res() res?: Response,
  ) {
    if (!caseNumber || !phone) {
      throw new ForbiddenException('Missing public download credentials');
    }

    const file = await this.filesService.assertPublicDownloadAccess(id, caseNumber, phone);
    const filePath = this.filesService.getFilePath(file.file_url);

    return res.sendFile(filePath, {
      root: process.cwd(),
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.filesService.remove(id);
  }
}
