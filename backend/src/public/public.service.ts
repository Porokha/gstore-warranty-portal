import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warranty } from '../warranties/entities/warranty.entity';
import { ServiceCase } from '../cases/entities/service-case.entity';
import { CaseStatusHistory } from '../cases/entities/case-status-history.entity';
import { SearchWarrantyDto } from './dto/search-warranty.dto';
import { SearchCaseDto } from './dto/search-case.dto';
import { CreateArcadeScoreDto } from './dto/create-arcade-score.dto';
import { ArcadeGame, ArcadeScore } from './entities/arcade-score.entity';

@Injectable()
export class PublicService {
  constructor(
    @InjectRepository(Warranty)
    private warrantiesRepository: Repository<Warranty>,
    @InjectRepository(ServiceCase)
    private casesRepository: Repository<ServiceCase>,
    @InjectRepository(CaseStatusHistory)
    private historyRepository: Repository<CaseStatusHistory>,
    @InjectRepository(ArcadeScore)
    private arcadeScoresRepository: Repository<ArcadeScore>,
  ) {}

  async searchWarranty(searchDto: SearchWarrantyDto) {
    const warranty = await this.warrantiesRepository.findOne({
      where: { warranty_id: searchDto.warranty_id },
      relations: ['service_cases'],
    });

    if (!warranty) {
      throw new NotFoundException('Warranty not found');
    }

    // Verify phone number matches
    if (warranty.customer_phone !== searchDto.phone) {
      throw new UnauthorizedException('Phone number does not match');
    }

    // Calculate warranty status
    const now = new Date();
    const warrantyEnd = new Date(warranty.warranty_end);
    const isActive = warrantyEnd >= now;
    const daysLeft = isActive
      ? Math.ceil((warrantyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : Math.ceil((now.getTime() - warrantyEnd.getTime()) / (1000 * 60 * 60 * 24));

    // Get case IDs for navigation
    const serviceCases = warranty.service_cases?.map((c) => ({
      id: c.id,
      case_number: c.case_number,
      status_level: c.status_level,
      opened_at: c.opened_at,
    })) || [];

    // Return public-safe information
    return {
      warranty_id: warranty.warranty_id,
      title: warranty.title,
      sku: warranty.sku,
      serial_number: warranty.serial_number,
      device_type: warranty.device_type,
      purchase_date: warranty.purchase_date,
      warranty_start: warranty.warranty_start,
      warranty_end: warranty.warranty_end,
      is_active: isActive,
      days_left: isActive ? daysLeft : null,
      days_after_warranty: !isActive ? daysLeft : null,
      extended_days: warranty.extended_days,
      service_cases_count: serviceCases.length,
      service_cases: serviceCases,
    };
  }

  async searchCase(searchDto: SearchCaseDto) {
    const case_ = await this.casesRepository.findOne({
      where: { case_number: searchDto.case_number },
      relations: ['warranty', 'assigned_technician'],
    });

    if (!case_) {
      throw new NotFoundException('Case not found');
    }

    // Verify phone number matches
    if (case_.customer_phone !== searchDto.phone) {
      throw new UnauthorizedException('Phone number does not match');
    }

    // Get public status history (only public notes)
    const history = await this.historyRepository.find({
      where: { case_id: case_.id },
      order: { created_at: 'DESC' },
    });

    const publicHistory = history
      .filter((h) => h.note_public) // Only show entries with public notes
      .map((h) => ({
        created_at: h.created_at,
        note_public: h.note_public,
        new_status_level: h.new_status_level,
        new_result: h.new_result,
      }));

    // Get warranty status if warranty exists
    let warrantyStatus = null;
    if (case_.warranty) {
      const now = new Date();
      const warrantyEnd = new Date(case_.warranty.warranty_end);
      warrantyStatus = {
        is_active: warrantyEnd >= now,
        warranty_end: case_.warranty.warranty_end,
      };
    }

    // Return public-safe information
    return {
      case_number: case_.case_number,
      product_title: case_.product_title,
      device_type: case_.device_type,
      opened_at: case_.opened_at,
      deadline_at: case_.deadline_at,
      status_level: case_.status_level,
      result_type: case_.result_type,
      status_history: publicHistory,
      warranty_id: case_.warranty?.warranty_id || null,
      warranty_status: warrantyStatus,
      customer_name: case_.customer_name,
      customer_last_name: case_.customer_last_name || null,
      customer_initial_note: case_.customer_initial_note || null,
      assigned_technician: case_.assigned_technician
        ? {
            name: case_.assigned_technician.name,
            last_name: case_.assigned_technician.last_name,
          }
        : null,
    };
  }

  async getArcadeScores() {
    const games = [ArcadeGame.TETRIS, ArcadeGame.SNAKE, ArcadeGame.INVADERS];
    const result: Record<string, any[]> = {};

    for (const game of games) {
      const scores = await this.arcadeScoresRepository.find({
        where: { game },
        order: { score: 'DESC', created_at: 'ASC' },
        take: 10,
      });

      result[game] = scores.map((entry) => ({
        id: entry.id,
        player_name: entry.player_name,
        score: entry.score,
        created_at: entry.created_at,
      }));
    }

    return result;
  }

  async createArcadeScore(createDto: CreateArcadeScoreDto) {
    const score = this.arcadeScoresRepository.create({
      game: createDto.game,
      player_name: createDto.player_name.trim().slice(0, 60),
      score: createDto.score,
    });

    const saved = await this.arcadeScoresRepository.save(score);

    return {
      id: saved.id,
      game: saved.game,
      player_name: saved.player_name,
      score: saved.score,
      created_at: saved.created_at,
    };
  }
}
