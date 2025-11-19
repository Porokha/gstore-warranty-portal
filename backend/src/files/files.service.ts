import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaseFile } from './entities/case-file.entity';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(CaseFile)
    private filesRepository: Repository<CaseFile>,
  ) {}
}

