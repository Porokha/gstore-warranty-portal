import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CaseStatusLevel, ServiceCase } from '../cases/entities/service-case.entity';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { Partner } from './entities/partner.entity';

@Injectable()
export class PartnersService {
  constructor(
    @InjectRepository(Partner)
    private partnersRepository: Repository<Partner>,
    @InjectRepository(ServiceCase)
    private casesRepository: Repository<ServiceCase>,
  ) {}

  async create(createDto: CreatePartnerDto): Promise<Partner> {
    const partner = this.partnersRepository.create({
      ...createDto,
      active: createDto.active ?? true,
    });

    return this.partnersRepository.save(partner);
  }

  async findAll(search?: string): Promise<Array<Partner & {
    total_cases: number;
    active_cases: number;
    completed_cases: number;
    last_case_at: Date | null;
  }>> {
    const query = this.partnersRepository
      .createQueryBuilder('partner')
      .leftJoin('partner.service_cases', 'service_case')
      .select('partner')
      .addSelect('COUNT(service_case.id)', 'total_cases')
      .addSelect(
        `SUM(CASE WHEN service_case.status_level < ${CaseStatusLevel.COMPLETED} THEN 1 ELSE 0 END)`,
        'active_cases',
      )
      .addSelect(
        `SUM(CASE WHEN service_case.status_level = ${CaseStatusLevel.COMPLETED} THEN 1 ELSE 0 END)`,
        'completed_cases',
      )
      .addSelect('MAX(service_case.opened_at)', 'last_case_at')
      .groupBy('partner.id')
      .orderBy('partner.created_at', 'DESC');

    if (search?.trim()) {
      query.where(
        new Brackets((qb) => {
          qb.where('partner.name LIKE :search', { search: `%${search.trim()}%` })
            .orWhere('partner.contact_person LIKE :search', { search: `%${search.trim()}%` })
            .orWhere('partner.phone LIKE :search', { search: `%${search.trim()}%` })
            .orWhere('partner.email LIKE :search', { search: `%${search.trim()}%` });
        }),
      );
    }

    const { entities, raw } = await query.getRawAndEntities();

    return entities.map((partner, index) => ({
      ...partner,
      total_cases: Number(raw[index]?.total_cases || 0),
      active_cases: Number(raw[index]?.active_cases || 0),
      completed_cases: Number(raw[index]?.completed_cases || 0),
      last_case_at: raw[index]?.last_case_at || null,
    }));
  }

  async findOne(id: number): Promise<Partner> {
    const partner = await this.partnersRepository.findOne({ where: { id } });
    if (!partner) {
      throw new NotFoundException(`Partner with ID ${id} not found`);
    }

    return partner;
  }

  async update(id: number, updateDto: UpdatePartnerDto): Promise<Partner> {
    const partner = await this.findOne(id);
    Object.assign(partner, updateDto);
    return this.partnersRepository.save(partner);
  }

  async getCases(id: number): Promise<ServiceCase[]> {
    await this.findOne(id);

    return this.casesRepository.find({
      where: { partner_id: id },
      relations: ['assigned_technician', 'created_by_user'],
      order: { opened_at: 'DESC' },
    });
  }
}
