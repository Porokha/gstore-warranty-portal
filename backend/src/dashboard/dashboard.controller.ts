import { Controller, Get, Query, UseGuards, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('device_type') deviceType?: string,
  ) {
    try {
      const timeFilter =
        start || end
          ? {
              start: start ? new Date(start) : undefined,
              end: end ? new Date(end) : undefined,
            }
          : undefined;

      const stats = await this.dashboardService.getDashboardStats(timeFilter);
      
      // If device type is specified, get average completion time for that device type
      if (deviceType) {
        const avgCompletionByDevice = await this.dashboardService.getAvgCompletionByDeviceType(
          deviceType,
          timeFilter,
        );
        stats.timeFiltered.avgCompletionByDeviceType = {
          [deviceType]: avgCompletionByDevice,
        };
      }

      return stats;
    } catch (error) {
      this.logger.error('Error fetching dashboard stats:', error);
      this.logger.error('Error stack:', error.stack);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch dashboard statistics',
          error: error.message || 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

