import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between } from 'typeorm';
import * as ExcelJS from 'exceljs';
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
    let totalPayments = 0;
    let paidPayments = 0;
    let totalPaidAmount = 0;

    if (technicianId) {
      // Get case IDs for this technician
      const caseIds = await this.casesRepository.find({
        where: { assigned_technician_id: technicianId },
        select: ['id'],
      });
      
      if (caseIds.length > 0) {
        const ids = caseIds.map(c => c.id);
        totalPayments = await this.paymentsRepository
          .createQueryBuilder('payment')
          .where('payment.case_id IN (:...ids)', { ids })
          .getCount();
        
        paidPayments = await this.paymentsRepository
          .createQueryBuilder('payment')
          .where('payment.case_id IN (:...ids)', { ids })
          .andWhere('payment.payment_status = :status', { status: PaymentStatus.PAID })
          .getCount();

        const paidResult = await this.paymentsRepository
          .createQueryBuilder('payment')
          .where('payment.case_id IN (:...ids)', { ids })
          .andWhere('payment.payment_status = :status', { status: PaymentStatus.PAID })
          .select('SUM(payment.offer_amount)', 'total')
          .getRawOne();
        
        totalPaidAmount = parseFloat(paidResult?.total || '0');
      }
    }

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

  async exportToExcel(stats: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Technician Statistics');

    // Add headers
    worksheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 },
    ];

    // Add data
    worksheet.addRow({ metric: 'Total Cases', value: stats.totalCases });
    worksheet.addRow({ metric: 'Running Cases', value: stats.runningCases });
    worksheet.addRow({ metric: 'Completed Cases', value: stats.completedCases });
    worksheet.addRow({ metric: 'Average Completion Time (days)', value: stats.avgCompletionTime });
    worksheet.addRow({ metric: 'On-time Cases', value: stats.onTimeCases });
    worksheet.addRow({ metric: 'On-time Rate (%)', value: stats.onTimeRate });
    worksheet.addRow({});
    worksheet.addRow({ metric: 'Cases by Status', value: '' });
    worksheet.addRow({ metric: '  - Opened', value: stats.casesByStatus.opened });
    worksheet.addRow({ metric: '  - Investigating', value: stats.casesByStatus.investigating });
    worksheet.addRow({ metric: '  - Pending', value: stats.casesByStatus.pending });
    worksheet.addRow({ metric: '  - Completed', value: stats.casesByStatus.completed });
    worksheet.addRow({});
    worksheet.addRow({ metric: 'Cases by Priority', value: '' });
    worksheet.addRow({ metric: '  - Low', value: stats.casesByPriority.low });
    worksheet.addRow({ metric: '  - Normal', value: stats.casesByPriority.normal });
    worksheet.addRow({ metric: '  - High', value: stats.casesByPriority.high });
    worksheet.addRow({ metric: '  - Critical', value: stats.casesByPriority.critical });
    worksheet.addRow({});
    worksheet.addRow({ metric: 'Payment Statistics', value: '' });
    worksheet.addRow({ metric: 'Total Payments', value: stats.totalPayments });
    worksheet.addRow({ metric: 'Paid Payments', value: stats.paidPayments });
    worksheet.addRow({ metric: 'Total Paid Amount (₾)', value: stats.totalPaidAmount });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportAllToExcel(stats: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('All Technicians Statistics');

    // Add headers
    worksheet.columns = [
      { header: 'Technician', key: 'technician', width: 25 },
      { header: 'Total Cases', key: 'totalCases', width: 15 },
      { header: 'Running', key: 'running', width: 15 },
      { header: 'Completed', key: 'completed', width: 15 },
      { header: 'Avg Completion (days)', key: 'avgCompletion', width: 20 },
      { header: 'On-time Rate (%)', key: 'onTimeRate', width: 18 },
      { header: 'Total Paid (₾)', key: 'totalPaid', width: 15 },
    ];

    // Add data rows
    stats.forEach((stat) => {
      worksheet.addRow({
        technician: `${stat.technician.name} ${stat.technician.last_name}`,
        totalCases: stat.totalCases,
        running: stat.runningCases,
        completed: stat.completedCases,
        avgCompletion: stat.avgCompletionTime,
        onTimeRate: stat.onTimeRate,
        totalPaid: stat.totalPaidAmount,
      });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

