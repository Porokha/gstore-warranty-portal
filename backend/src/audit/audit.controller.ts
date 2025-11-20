import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AuditService } from './audit.service';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  findAll(
    @Query('user_id') userId?: string,
    @Query('action') action?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const filters: any = {};
    
    if (userId) {
      const userIdNum = parseInt(userId, 10);
      if (!isNaN(userIdNum)) {
        filters.user_id = userIdNum;
      }
    }
    
    if (action) {
      filters.action = action;
    }
    
    if (startDate) {
      filters.start_date = new Date(startDate);
    }
    
    if (endDate) {
      filters.end_date = new Date(endDate);
    }

    return this.auditService.findAll(filters);
  }
}
