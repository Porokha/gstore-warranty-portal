import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warranty } from './entities/warranty.entity';

@Injectable()
export class WarrantiesService {
  constructor(
    @InjectRepository(Warranty)
    private warrantiesRepository: Repository<Warranty>,
  ) {}

  async findAll(): Promise<Warranty[]> {
    return this.warrantiesRepository.find();
  }
}

