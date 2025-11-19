import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceCase } from './entities/service-case.entity';

@Injectable()
export class CasesService {
  constructor(
    @InjectRepository(ServiceCase)
    private casesRepository: Repository<ServiceCase>,
  ) {}

  // Placeholder methods - to be implemented
  async findAll(): Promise<ServiceCase[]> {
    return this.casesRepository.find();
  }

  async findOne(id: number): Promise<ServiceCase | null> {
    return this.casesRepository.findOne({ where: { id } });
  }
}

