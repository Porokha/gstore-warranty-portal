import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, LessThanOrEqual, MoreThan, Between } from 'typeorm';
import { ServiceCase, CaseStatusLevel } from '../cases/entities/service-case.entity';
import { Warranty } from '../warranties/entities/warranty.entity';
import { CasePayment, PaymentStatus } from '../payments/entities/case-payment.entity';
import { SlaService } from '../sla/sla.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(ServiceCase)
    private casesRepository: Repository<ServiceCase>,
    @InjectRepository(Warranty)
    private warrantiesRepository: Repository<Warranty>,
    @InjectRepository(CasePayment)
    private paymentsRepository: Repository<CasePayment>,
    private slaService: SlaService,
  ) {}

  async getDashboardStats(timeFilter?: { start?: Date; end?: Date }) {
    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Real-time stats (no time filter)
    const openCases = await this.casesRepository.count({
      where: { status_level: LessThan(CaseStatusLevel.COMPLETED) },
    });

    const closeToDeadline = await this.casesRepository
      .createQueryBuilder('case')
      .where('case.status_level < :completed', { completed: CaseStatusLevel.COMPLETED })
      .andWhere('case.deadline_at <= :in48Hours', { in48Hours })
      .andWhere('case.deadline_at > :now', { now })
      .getCount();

    const dueCases = await this.casesRepository.count({
      where: {
        status_level: LessThan(CaseStatusLevel.COMPLETED),
        deadline_at: LessThan(now),
      },
    });

    // Time-filtered stats
    const closedCasesWhere: any = {
      status_level: CaseStatusLevel.COMPLETED,
    };
    if (timeFilter?.start) {
      closedCasesWhere.closed_at = MoreThan(timeFilter.start);
    }
    if (timeFilter?.end) {
      closedCasesWhere.closed_at = LessThanOrEqual(timeFilter.end);
    }

    const closedCases = await this.casesRepository.count({
      where: closedCasesWhere,
    });

    // Active warranties (purchased in period, still active)
    const activeWarrantiesWhere: any = {
      warranty_end: MoreThan(now),
    };
    if (timeFilter?.start) {
      activeWarrantiesWhere.purchase_date = MoreThan(timeFilter.start);
    }
    if (timeFilter?.end) {
      activeWarrantiesWhere.purchase_date = LessThanOrEqual(timeFilter.end);
    }

    const activeWarranties = await this.warrantiesRepository.count({
      where: activeWarrantiesWhere,
    });

    // Expired warranties (expired in period)
    const expiredWarrantiesWhere: any = {
      warranty_end: LessThan(now),
    };
    if (timeFilter?.start) {
      expiredWarrantiesWhere.warranty_end = MoreThan(timeFilter.start);
    }
    if (timeFilter?.end) {
      expiredWarrantiesWhere.warranty_end = LessThanOrEqual(timeFilter.end);
    }

    const expiredWarranties = await this.warrantiesRepository.count({
      where: expiredWarrantiesWhere,
    });

    // Average completion time
    const completedCasesWhere: any = {
      status_level: CaseStatusLevel.COMPLETED,
    };
    if (timeFilter?.start) {
      completedCasesWhere.closed_at = MoreThan(timeFilter.start);
    }

    const completedCases = await this.casesRepository.find({
      where: completedCasesWhere,
      select: ['opened_at', 'closed_at'],
    });

    const avgCompletionTime =
      completedCases.length > 0
        ? completedCases
            .filter((case_) => case_.closed_at != null) // Filter out cases without closed_at
            .reduce((sum, case_) => {
              const diff = case_.closed_at.getTime() - case_.opened_at.getTime();
              return sum + diff / (1000 * 60 * 60 * 24); // days
            }, 0) / completedCases.filter((case_) => case_.closed_at != null).length || 0
        : 0;

    // On-time cases (closed before or on deadline)
    let onTimeQuery = this.casesRepository
      .createQueryBuilder('case')
      .where('case.status_level = :completed', { completed: CaseStatusLevel.COMPLETED })
      .andWhere('case.closed_at IS NOT NULL')
      .andWhere('case.closed_at <= case.deadline_at');
    
    if (timeFilter?.start) {
      onTimeQuery = onTimeQuery.andWhere('case.closed_at > :start', { start: timeFilter.start });
    }
    if (timeFilter?.end) {
      onTimeQuery = onTimeQuery.andWhere('case.closed_at <= :end', { end: timeFilter.end });
    }

    const onTimeCases = await onTimeQuery.getCount();


    // Financial stats
    const paymentsWhere: any = {
      payment_status: PaymentStatus.PAID,
    };
    if (timeFilter?.start) {
      paymentsWhere.created_at = MoreThan(timeFilter.start);
    }
    if (timeFilter?.end) {
      paymentsWhere.created_at = LessThanOrEqual(timeFilter.end);
    }

    const payments = await this.paymentsRepository.find({
      where: paymentsWhere,
      select: ['offer_amount'],
    });

    const totalPayments = payments.length;
    const totalMoneyIn = payments.reduce((sum, p) => sum + Number(p.offer_amount || 0), 0);

    return {
      realTime: {
        openCases,
        closeToDeadline,
        dueCases,
      },
      timeFiltered: {
        closedCases,
        activeWarranties,
        expiredWarranties,
        avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
        avgCompletionByDeviceType: {}, // Will be populated by controller if device_type is specified
        onTimeCases,
        totalPayments,
        totalMoneyIn,
        totalMoneyLost: 0, // To be calculated based on business logic
      },
    };
  }

  async getAvgCompletionByDeviceType(deviceType: string, timeFilter?: { start?: Date; end?: Date }) {
    const completedCasesWhere: any = {
      status_level: CaseStatusLevel.COMPLETED,
      device_type: deviceType,
    };
    
    if (timeFilter?.start) {
      completedCasesWhere.closed_at = MoreThan(timeFilter.start);
    }
    if (timeFilter?.end) {
      completedCasesWhere.closed_at = LessThanOrEqual(timeFilter.end);
    }

    const completedCases = await this.casesRepository.find({
      where: completedCasesWhere,
      select: ['opened_at', 'closed_at'],
    });

    const validCases = completedCases.filter((case_) => case_.closed_at != null);
    
    if (validCases.length === 0) {
      return 0;
    }

    const avg = validCases.reduce((sum, case_) => {
      const diff = case_.closed_at.getTime() - case_.opened_at.getTime();
      return sum + diff / (1000 * 60 * 60 * 24);
    }, 0) / validCases.length;

    return Math.round(avg * 10) / 10;
  }
}

