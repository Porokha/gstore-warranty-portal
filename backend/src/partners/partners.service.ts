import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CaseStatusLevel, ServiceCase } from '../cases/entities/service-case.entity';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { Partner } from './entities/partner.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';

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
      archived_at: null,
    });

    return this.partnersRepository.save(partner);
  }

  async findAll(search?: string, archived = false): Promise<Array<Partner & {
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
      .where(archived ? 'partner.archived_at IS NOT NULL' : 'partner.archived_at IS NULL')
      .groupBy('partner.id')
      .orderBy('partner.created_at', 'DESC');

    if (search?.trim()) {
      query.andWhere(
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
    if (partner.archived_at) {
      throw new BadRequestException('Archived partners must be restored before editing');
    }
    Object.assign(partner, updateDto);
    return this.partnersRepository.save(partner);
  }

  async archiveOrDelete(id: number, userId: number) {
    const result = await this.partnersRepository.manager.transaction(async (manager) => {
      const partner = await manager.getRepository(Partner)
        .createQueryBuilder('partner')
        .setLock('pessimistic_write')
        .where('partner.id = :id', { id })
        .getOne();

      if (!partner || partner.archived_at) {
        throw new NotFoundException(`Active partner with ID ${id} not found`);
      }

      const linkedCases = await manager.getRepository(ServiceCase).count({ where: { partner_id: id } });
      let result: { action: 'archived' | 'deleted'; partner_id: number; linked_cases: number };
      if (linkedCases > 0) {
        partner.archived_at = new Date();
        await manager.getRepository(Partner).save(partner);
        result = { action: 'archived', partner_id: id, linked_cases: linkedCases };
      } else {
        await manager.getRepository(Partner).delete(id);
        result = { action: 'deleted', partner_id: id, linked_cases: 0 };
      }

      await manager.getRepository(AuditLog).save({
        user_id: userId,
        action: `partner.${result.action}`,
        payload_json: result,
      });
      return result;
    });

    return result;
  }

  async restore(id: number, userId: number): Promise<Partner> {
    return this.partnersRepository.manager.transaction(async (manager) => {
      const partner = await manager.getRepository(Partner)
        .createQueryBuilder('partner')
        .setLock('pessimistic_write')
        .where('partner.id = :id', { id })
        .getOne();
      if (!partner) {
        throw new NotFoundException(`Partner with ID ${id} not found`);
      }
      if (!partner.archived_at) {
        throw new BadRequestException('Partner is not archived');
      }

      partner.archived_at = null;
      const restored = await manager.getRepository(Partner).save(partner);
      await manager.getRepository(AuditLog).save({
        user_id: userId,
        action: 'partner.restored',
        payload_json: { partner_id: id },
      });
      return restored;
    });
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
