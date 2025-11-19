import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { join } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { CaseFile, FileType } from './entities/case-file.entity';
import { ServiceCase } from '../cases/entities/service-case.entity';

@Injectable()
export class FilesService {
  private readonly uploadsDir = join(process.cwd(), 'uploads');

  constructor(
    @InjectRepository(CaseFile)
    private filesRepository: Repository<CaseFile>,
    @InjectRepository(ServiceCase)
    private casesRepository: Repository<ServiceCase>,
  ) {
    // Ensure uploads directory exists
    if (!existsSync(this.uploadsDir)) {
      mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  private detectFileType(filename: string): FileType {
    const ext = filename.toLowerCase().split('.').pop();
    
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
    const pdfExts = ['pdf'];

    if (imageExts.includes(ext)) {
      return FileType.IMAGE;
    }
    if (videoExts.includes(ext)) {
      return FileType.VIDEO;
    }
    if (pdfExts.includes(ext)) {
      return FileType.PDF;
    }
    return FileType.OTHER;
  }

  async uploadFile(
    caseId: number,
    file: Express.Multer.File,
    uploadedBy: number,
  ): Promise<CaseFile> {
    const case_ = await this.casesRepository.findOne({
      where: { id: caseId },
    });

    if (!case_) {
      throw new NotFoundException(`Case with ID ${caseId} not found`);
    }

    // File is already saved by multer to uploads/cases/{caseId}/filename
    // We just need to create the database record
    const fileUrl = `/uploads/cases/${caseId}/${file.filename}`;
    const fileType = this.detectFileType(file.originalname);

    const caseFile = this.filesRepository.create({
      case_id: caseId,
      file_url: fileUrl,
      file_type: fileType,
      uploaded_by: uploadedBy,
    });

    return this.filesRepository.save(caseFile);
  }

  async findAllByCase(caseId: number): Promise<CaseFile[]> {
    const case_ = await this.casesRepository.findOne({
      where: { id: caseId },
    });

    if (!case_) {
      throw new NotFoundException(`Case with ID ${caseId} not found`);
    }

    return this.filesRepository.find({
      where: { case_id: caseId },
      relations: ['uploaded_by_user'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<CaseFile> {
    const file = await this.filesRepository.findOne({
      where: { id },
      relations: ['case_', 'uploaded_by_user'],
    });

    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    return file;
  }

  async remove(id: number): Promise<void> {
    const file = await this.findOne(id);

    // Delete physical file
    const filePath = join(process.cwd(), file.file_url);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }

    await this.filesRepository.remove(file);
  }

  getFilePath(fileUrl: string): string {
    return join(process.cwd(), fileUrl);
  }
}
