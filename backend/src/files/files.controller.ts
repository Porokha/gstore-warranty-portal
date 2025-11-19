import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FilesService } from './files.service';
import { ServiceCase } from '../cases/entities/service-case.entity';

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
          const ext = extname(file.originalname);
          cb(null, `${timestamp}_${randomStr}${ext}`);
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'video/mp4',
          'video/quicktime',
          'video/x-msvideo',
          'application/pdf',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type'), false);
        }
      },
    }),
  )
  async uploadFile(
    @Param('caseId', ParseIntPipe) caseId: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    // Update file path to match the saved location
    const fileUrl = `/uploads/cases/${caseId}/${file.filename}`;
    file.path = fileUrl;

    return this.filesService.uploadFile(caseId, file, user.id);
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

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.filesService.remove(id);
  }
}
