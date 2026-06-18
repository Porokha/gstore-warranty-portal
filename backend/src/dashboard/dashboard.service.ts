import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, LessThanOrEqual, MoreThan, Between } from 'typeorm';
import { ServiceCase, CaseStatusLevel } from '../cases/entities/service-case.entity';
import { Warranty } from '../warranties/entities/warranty.entity';
import { CasePayment, PaymentStatus } from '../payments/entities/case-payment.entity';
@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(ServiceCase)
    private casesRepository: Repository<ServiceCase>,
    @InjectRepository(Warranty)
    private warrantiesRepository: Repository<Warranty>,
    @InjectRepository(CasePayment)
    private paymentsRepository: Repository<CasePayment>,
  ) {}

  async getDashboardStats(timeFilter?: { start?: Date; end?: Date }) {
    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Real-time stats (no time filter) - count all non-completed cases
    const openCases = await this.casesRepository
      .createQueryBuilder('case')
      .where('case.status_level < :completed', { completed: CaseStatusLevel.COMPLETED })
      .getCount();
    
    // Ensure we return at least 0 if query fails
    if (isNaN(openCases)) {
      console.warn('openCases count is NaN, defaulting to 0');
    }

    const closeToDeadline = await this.casesRepository
      .createQueryBuilder('case')
      .where('case.status_level < :completed', { completed: CaseStatusLevel.COMPLETED })
      .andWhere('case.status_level != :pending', { pending: CaseStatusLevel.PENDING })
      .andWhere('case.deadline_at <= :in48Hours', { in48Hours })
      .andWhere('case.deadline_at > :now', { now })
      .getCount();

    const dueCases = await this.casesRepository
      .createQueryBuilder('case')
      .where('case.status_level < :completed', { completed: CaseStatusLevel.COMPLETED })
      .andWhere('case.status_level != :pending', { pending: CaseStatusLevel.PENDING })
      .andWhere('case.deadline_at < :now', { now })
      .getCount();

    // Time-filtered stats
    let closedCasesQuery = this.casesRepository
      .createQueryBuilder('case')
      .where('case.status_level = :completed', { completed: CaseStatusLevel.COMPLETED })
      .andWhere('case.closed_at IS NOT NULL');
    
    if (timeFilter?.start) {
      closedCasesQuery = closedCasesQuery.andWhere('case.closed_at > :start', { start: timeFilter.start });
    }
    if (timeFilter?.end) {
      closedCasesQuery = closedCasesQuery.andWhere('case.closed_at <= :end', { end: timeFilter.end });
    }

    const closedCases = await closedCasesQuery.getCount();

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
    let completedCasesQuery = this.casesRepository
      .createQueryBuilder('case')
      .where('case.status_level = :completed', { completed: CaseStatusLevel.COMPLETED })
      .andWhere('case.closed_at IS NOT NULL');
    
    if (timeFilter?.start) {
      completedCasesQuery = completedCasesQuery.andWhere('case.closed_at > :start', { start: timeFilter.start });
    }
    if (timeFilter?.end) {
      completedCasesQuery = completedCasesQuery.andWhere('case.closed_at <= :end', { end: timeFilter.end });
    }

    const completedCases = await completedCasesQuery
      .getMany();

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
    let completedCasesQuery = this.casesRepository
      .createQueryBuilder('case')
      .where('case.status_level = :completed', { completed: CaseStatusLevel.COMPLETED })
      .andWhere('case.device_type = :deviceType', { deviceType })
      .andWhere('case.closed_at IS NOT NULL');
    
    if (timeFilter?.start) {
      completedCasesQuery = completedCasesQuery.andWhere('case.closed_at > :start', { start: timeFilter.start });
    }
    if (timeFilter?.end) {
      completedCasesQuery = completedCasesQuery.andWhere('case.closed_at <= :end', { end: timeFilter.end });
    }

    const completedCases = await completedCasesQuery
      .getMany();
    
    if (completedCases.length === 0) {
      return 0;
    }

    const avg = completedCases.reduce((sum, case_) => {
      const diff = case_.closed_at.getTime() - case_.opened_at.getTime();
      return sum + diff / (1000 * 60 * 60 * 24);
    }, 0) / completedCases.length;

    return Math.round(avg * 10) / 10;
  }

  async getCasesByStatus(timeFilter?: { start?: Date; end?: Date }) {
    let query = this.casesRepository.createQueryBuilder('case');
    
    if (timeFilter?.start) {
      query = query.andWhere('case.opened_at >= :start', { start: timeFilter.start });
    }
    if (timeFilter?.end) {
      query = query.andWhere('case.opened_at <= :end', { end: timeFilter.end });
    }

    const cases = await query.getMany();
    
    const statusCounts = {
      opened: 0,
      investigating: 0,
      pending: 0,
      completed: 0,
    };

    cases.forEach((case_) => {
      // Use status_level enum to determine status
      switch (case_.status_level) {
        case CaseStatusLevel.OPENED:
          statusCounts.opened++;
          break;
        case CaseStatusLevel.INVESTIGATING:
          statusCounts.investigating++;
          break;
        case CaseStatusLevel.PENDING:
          statusCounts.pending++;
          break;
        case CaseStatusLevel.COMPLETED:
          statusCounts.completed++;
          break;
      }
    });

    const total = cases.length;
    if (total === 0) {
      return [
        { name: 'Completed', value: 0, percentage: 0, color: '#10b981' },
        { name: 'Investigating', value: 0, percentage: 0, color: '#f59e0b' },
        { name: 'Pending', value: 0, percentage: 0, color: '#3b82f6' },
        { name: 'Opened', value: 0, percentage: 0, color: '#8b5cf6' },
      ];
    }

    return [
      { 
        name: 'Completed', 
        value: statusCounts.completed, 
        percentage: Math.round((statusCounts.completed / total) * 100),
        color: '#10b981',
      },
      { 
        name: 'Investigating', 
        value: statusCounts.investigating, 
        percentage: Math.round((statusCounts.investigating / total) * 100),
        color: '#f59e0b',
      },
      { 
        name: 'Pending', 
        value: statusCounts.pending, 
        percentage: Math.round((statusCounts.pending / total) * 100),
        color: '#3b82f6',
      },
      { 
        name: 'Opened', 
        value: statusCounts.opened, 
        percentage: Math.round((statusCounts.opened / total) * 100),
        color: '#8b5cf6',
      },
    ];
  }

  async getCompletionTimeByDeviceType(timeFilter?: { start?: Date; end?: Date }) {
    const deviceTypes = ['Phone', 'Laptop', 'Tablet', 'Desktop', 'Wearable', 'Accessory'];
    const result = [];

    for (const deviceType of deviceTypes) {
      let query = this.casesRepository
        .createQueryBuilder('case')
        .where('case.status_level = :completed', { completed: CaseStatusLevel.COMPLETED })
        .andWhere('case.device_type = :deviceType', { deviceType })
        .andWhere('case.closed_at IS NOT NULL');

      if (timeFilter?.start) {
        query = query.andWhere('case.closed_at >= :start', { start: timeFilter.start });
      }
      if (timeFilter?.end) {
        query = query.andWhere('case.closed_at <= :end', { end: timeFilter.end });
      }

      const cases = await query.getMany();

      if (cases.length > 0) {
        const avgTime = cases.reduce((sum, case_) => {
          const diff = case_.closed_at.getTime() - case_.opened_at.getTime();
          return sum + diff / (1000 * 60 * 60 * 24); // days
        }, 0) / cases.length;

        result.push({
          name: deviceType === 'Phone' ? 'Smartphones' : deviceType === 'Wearable' ? 'Wearables' : deviceType + 's',
          value: Math.round(avgTime * 10) / 10,
        });
      }
    }

    return result;
  }

  async getCasesByDeviceType(timeFilter?: { start?: Date; end?: Date }) {
    const deviceTypes = ['Phone', 'Laptop', 'Tablet', 'Desktop', 'Wearable', 'Accessory'];
    const result = [];

    for (const deviceType of deviceTypes) {
      let query = this.casesRepository
        .createQueryBuilder('case')
        .where('case.device_type = :deviceType', { deviceType });

      if (timeFilter?.start) {
        query = query.andWhere('case.opened_at >= :start', { start: timeFilter.start });
      }
      if (timeFilter?.end) {
        query = query.andWhere('case.opened_at <= :end', { end: timeFilter.end });
      }

      const count = await query.getCount();

      if (count > 0) {
        result.push({
          name: deviceType === 'Phone' ? 'Smartphones' : deviceType === 'Wearable' ? 'Wearables' : deviceType + 's',
          value: count,
        });
      }
    }

    return result;
  }
}
