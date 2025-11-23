import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between } from 'typeorm';
import { ServiceCase, CaseStatusLevel } from '../cases/entities/service-case.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CasePayment, PaymentStatus } from '../payments/entities/case-payment.entity';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(ServiceCase)
    private casesRepository: Repository<ServiceCase>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(CasePayment)
    private paymentsRepository: Repository<CasePayment>,
  ) {}

  async getTechnicianStats(
    technicianId?: number,
    startDate?: string,
    endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const whereClause: any = {};
    if (technicianId) {
      whereClause.assigned_technician_id = technicianId;
    }
    if (start || end) {
      whereClause.opened_at = start && end 
        ? Between(start, end)
        : start 
        ? MoreThan(start)
        : LessThan(end);
    }

    // Total cases assigned
    const totalCases = await this.casesRepository.count({ where: whereClause });

    // Running cases (non-completed)
    const runningCases = await this.casesRepository.count({
      where: {
        ...whereClause,
        status_level: LessThan(CaseStatusLevel.COMPLETED),
      },
    });

    // Completed cases
    const completedCases = await this.casesRepository.count({
      where: {
        ...whereClause,
        status_level: CaseStatusLevel.COMPLETED,
      },
    });

    // Average completion time
    const completedCasesWithDates = await this.casesRepository.find({
      where: {
        ...whereClause,
        status_level: CaseStatusLevel.COMPLETED,
        closed_at: MoreThan(new Date(0)), // Not null
      },
    });

    let avgCompletionTime = 0;
    if (completedCasesWithDates.length > 0) {
      const totalDays = completedCasesWithDates.reduce((sum, case_) => {
        const days = Math.ceil(
          (case_.closed_at.getTime() - case_.opened_at.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);
      avgCompletionTime = Math.round(totalDays / completedCasesWithDates.length);
    }

    // On-time cases (completed before deadline)
    const onTimeCases = completedCasesWithDates.filter(
      (case_) => case_.closed_at <= case_.deadline_at
    ).length;

    // Cases by status
    const casesByStatus = {
      opened: await this.casesRepository.count({
        where: { ...whereClause, status_level: CaseStatusLevel.OPENED },
      }),
      investigating: await this.casesRepository.count({
        where: { ...whereClause, status_level: CaseStatusLevel.INVESTIGATING },
      }),
      pending: await this.casesRepository.count({
        where: { ...whereClause, status_level: CaseStatusLevel.PENDING },
      }),
      completed: completedCases,
    };

    // Cases by priority
    const casesByPriority = {
      low: await this.casesRepository.count({
        where: { ...whereClause, priority: 'low' },
      }),
      normal: await this.casesRepository.count({
        where: { ...whereClause, priority: 'normal' },
      }),
      high: await this.casesRepository.count({
        where: { ...whereClause, priority: 'high' },
      }),
      critical: await this.casesRepository.count({
        where: { ...whereClause, priority: 'critical' },
      }),
    };

    // Payment stats
    const paymentsWhere: any = {};
    if (technicianId) {
      // Get case IDs for this technician
      const caseIds = await this.casesRepository.find({
        where: { assigned_technician_id: technicianId },
        select: ['id'],
      });
      paymentsWhere.case_id = { $in: caseIds.map(c => c.id) };
    }

    const totalPayments = await this.paymentsRepository.count({ where: paymentsWhere });
    const paidPayments = await this.paymentsRepository.count({
      where: { ...paymentsWhere, payment_status: PaymentStatus.PAID },
    });

    const paidAmount = await this.paymentsRepository
      .createQueryBuilder('payment')
      .where('payment.payment_status = :status', { status: PaymentStatus.PAID })
      .select('SUM(payment.paid_amount)', 'total')
      .getRawOne();

    return {
      technicianId,
      period: { start, end },
      totalCases,
      runningCases,
      completedCases,
      avgCompletionTime,
      onTimeCases,
      onTimeRate: completedCases > 0 ? ((onTimeCases / completedCases) * 100).toFixed(1) : '0',
      casesByStatus,
      casesByPriority,
      totalPayments,
      paidPayments,
      totalPaidAmount: paidAmount?.total || 0,
    };
  }

  async getAllTechniciansStats(startDate?: string, endDate?: string) {
    const technicians = await this.usersRepository.find({
      where: { role: UserRole.TECHNICIAN },
    });

    const stats = await Promise.all(
      technicians.map((tech) =>
        this.getTechnicianStats(tech.id, startDate, endDate).then((stat) => ({
          technician: {
            id: tech.id,
            name: tech.name,
            last_name: tech.last_name,
            username: tech.username,
          },
          ...stat,
        }))
      )
    );

    return stats;
  }
}

