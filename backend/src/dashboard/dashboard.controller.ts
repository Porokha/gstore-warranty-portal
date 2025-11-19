import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const timeFilter =
      start || end
        ? {
            start: start ? new Date(start) : undefined,
            end: end ? new Date(end) : undefined,
          }
        : undefined;

    return this.dashboardService.getDashboardStats(timeFilter);
  }
}

