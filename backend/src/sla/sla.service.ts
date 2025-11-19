import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between } from 'typeorm';
import { ServiceCase, CaseStatusLevel } from '../cases/entities/service-case.entity';
import { SmsService } from '../sms/sms.service';
import { Language } from '../sms/entities/sms-template.entity';

export interface SLAMetrics {
  totalOpenCases: number;
  casesCloseToDeadline: number; // Within 1 day
  casesDue: number; // Past deadline
  casesStalled: number; // No activity for 3+ days
  avgDaysToCompletion: number;
  onTimeCompletionRate: number; // Percentage
}

@Injectable()
export class SlaService {
  private readonly logger = new Logger(SlaService.name);

  constructor(
    @InjectRepository(ServiceCase)
    private casesRepository: Repository<ServiceCase>,
    private smsService: SmsService,
  ) {}

  async getMetrics(): Promise<SLAMetrics> {
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    // Open cases (status 1, 2, or 3)
    const openCases = await this.casesRepository.find({
      where: [
        { status_level: CaseStatusLevel.OPENED },
        { status_level: CaseStatusLevel.INVESTIGATING },
        { status_level: CaseStatusLevel.PENDING },
      ],
    });

    // Cases close to deadline (within 1 day)
    const casesCloseToDeadline = openCases.filter(
      (case_) =>
        new Date(case_.deadline_at) <= oneDayFromNow &&
        new Date(case_.deadline_at) >= now,
    ).length;

    // Cases past deadline
    const casesDue = openCases.filter(
      (case_) => new Date(case_.deadline_at) < now,
    ).length;

    // Cases stalled (no activity for 3+ days)
    const casesStalled = openCases.filter((case_) => {
      const lastUpdate = case_.updated_at || case_.opened_at;
      return new Date(lastUpdate) < threeDaysAgo;
    }).length;

    // Calculate average completion time
    const completedCases = await this.casesRepository.find({
      where: { status_level: CaseStatusLevel.COMPLETED },
      select: ['opened_at', 'closed_at'],
    });

    let avgDaysToCompletion = 0;
    if (completedCases.length > 0) {
      const totalDays = completedCases
        .filter((c) => c.closed_at)
        .reduce((sum, c) => {
          const days = Math.ceil(
            (new Date(c.closed_at!).getTime() - new Date(c.opened_at).getTime()) /
              (1000 * 60 * 60 * 24),
          );
          return sum + days;
        }, 0);
      avgDaysToCompletion = totalDays / completedCases.filter((c) => c.closed_at).length;
    }

    // Calculate on-time completion rate
    const onTimeCases = completedCases.filter((c) => {
      if (!c.closed_at) return false;
      return new Date(c.closed_at) <= new Date(c.opened_at);
    }).length;

    const onTimeCompletionRate =
      completedCases.length > 0
        ? (onTimeCases / completedCases.filter((c) => c.closed_at).length) * 100
        : 0;

    return {
      totalOpenCases: openCases.length,
      casesCloseToDeadline: casesCloseToDeadline,
      casesDue: casesDue,
      casesStalled: casesStalled,
      avgDaysToCompletion: Math.round(avgDaysToCompletion * 10) / 10,
      onTimeCompletionRate: Math.round(onTimeCompletionRate * 10) / 10,
    };
  }

  async checkSLAAlerts(): Promise<void> {
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    // Get open cases
    const openCases = await this.casesRepository.find({
      where: [
        { status_level: CaseStatusLevel.OPENED },
        { status_level: CaseStatusLevel.INVESTIGATING },
        { status_level: CaseStatusLevel.PENDING },
      ],
    });

    // Check for cases due (past deadline)
    const dueCases = openCases.filter(
      (case_) => new Date(case_.deadline_at) < now,
    );

    for (const case_ of dueCases) {
      await this.sendSLAAlert(case_, 'sla_due');
    }

    // Check for cases close to deadline (within 1 day)
    const closeToDeadlineCases = openCases.filter(
      (case_) =>
        new Date(case_.deadline_at) <= oneDayFromNow &&
        new Date(case_.deadline_at) >= now,
    );

    for (const case_ of closeToDeadlineCases) {
      await this.sendSLAAlert(case_, 'sla_deadline_1day');
    }

    // Check for stalled cases (no activity for 3+ days)
    const stalledCases = openCases.filter((case_) => {
      const lastUpdate = case_.updated_at || case_.opened_at;
      return new Date(lastUpdate) < threeDaysAgo;
    });

    for (const case_ of stalledCases) {
      await this.sendSLAAlert(case_, 'sla_stalled');
    }
  }

  private async sendSLAAlert(case_: ServiceCase, alertType: string): Promise<void> {
    if (!case_.customer_phone) {
      return;
    }

    try {
      const daysOverdue = Math.ceil(
        (new Date().getTime() - new Date(case_.deadline_at).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      const daysUntilDeadline = Math.ceil(
        (new Date(case_.deadline_at).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      );

      const variables: Record<string, any> = {
        case_number: case_.case_number,
        product_title: case_.product_title,
        deadline: new Date(case_.deadline_at).toLocaleDateString('ka-GE'),
      };

      if (alertType === 'sla_due') {
        variables.days_overdue = daysOverdue;
      } else if (alertType === 'sla_deadline_1day') {
        variables.days_until_deadline = daysUntilDeadline;
      }

      await this.smsService.sendSms({
        phone: case_.customer_phone,
        templateKey: `sms.${alertType}`,
        language: Language.KA,
        variables,
      });
    } catch (error) {
      this.logger.error(`Failed to send SLA alert for case ${case_.id}:`, error.message);
    }
  }

  async getCasesCloseToDeadline(days: number = 1): Promise<ServiceCase[]> {
    const now = new Date();
    const deadline = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return this.casesRepository.find({
      where: [
        { status_level: CaseStatusLevel.OPENED },
        { status_level: CaseStatusLevel.INVESTIGATING },
        { status_level: CaseStatusLevel.PENDING },
      ],
      relations: ['assigned_technician'],
    }).then((cases) =>
      cases.filter(
        (case_) =>
          new Date(case_.deadline_at) <= deadline &&
          new Date(case_.deadline_at) >= now,
      ),
    );
  }

  async getDueCases(): Promise<ServiceCase[]> {
    const now = new Date();

    return this.casesRepository.find({
      where: [
        { status_level: CaseStatusLevel.OPENED },
        { status_level: CaseStatusLevel.INVESTIGATING },
        { status_level: CaseStatusLevel.PENDING },
      ],
      relations: ['assigned_technician'],
    }).then((cases) =>
      cases.filter((case_) => new Date(case_.deadline_at) < now),
    );
  }

  async getStalledCases(days: number = 3): Promise<ServiceCase[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.casesRepository.find({
      where: [
        { status_level: CaseStatusLevel.OPENED },
        { status_level: CaseStatusLevel.INVESTIGATING },
        { status_level: CaseStatusLevel.PENDING },
      ],
      relations: ['assigned_technician'],
    }).then((cases) =>
      cases.filter((case_) => {
        const lastUpdate = case_.updated_at || case_.opened_at;
        return new Date(lastUpdate) < cutoffDate;
      }),
    );
  }
}

