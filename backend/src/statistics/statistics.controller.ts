import { Controller, Get, Query, UseGuards, Request, Res, Header } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatisticsController {
  constructor(private statisticsService: StatisticsService) {}

  @Get('technicians')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  async getTechnicianStats(
    @Query('technician_id') technicianId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Request() req?: any,
  ) {
    // If technician, only show their own stats
    if (req.user.role === UserRole.TECHNICIAN) {
      return this.statisticsService.getTechnicianStats(req.user.id, startDate, endDate);
    }
    
    // If admin, show specific technician or all technicians
    const techId = technicianId ? parseInt(technicianId, 10) : undefined;
    return this.statisticsService.getTechnicianStats(techId, startDate, endDate);
  }

  @Get('technicians/all')
  @Roles(UserRole.ADMIN)
  async getAllTechniciansStats(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.statisticsService.getAllTechniciansStats(startDate, endDate);
  }

  @Get('technicians/export')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename=technician-statistics.xlsx')
  async exportTechnicianStats(
    @Query('technician_id') technicianId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Request() req?: any,
    @Res() res?: Response,
  ) {
    const stats = req.user.role === UserRole.TECHNICIAN
      ? await this.statisticsService.getTechnicianStats(req.user.id, startDate, endDate)
      : await this.statisticsService.getTechnicianStats(
          technicianId ? parseInt(technicianId, 10) : undefined,
          startDate,
          endDate
        );
    
    const excelBuffer = await this.statisticsService.exportToExcel(stats);
    res.send(excelBuffer);
  }

  @Get('technicians/all/export')
  @Roles(UserRole.ADMIN)
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename=all-technicians-statistics.xlsx')
  async exportAllTechniciansStats(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Res() res?: Response,
  ) {
    const stats = await this.statisticsService.getAllTechniciansStats(startDate, endDate);
    const excelBuffer = await this.statisticsService.exportAllToExcel(stats);
    res.send(excelBuffer);
  }
}

