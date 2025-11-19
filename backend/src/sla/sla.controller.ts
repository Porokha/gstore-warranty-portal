import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SlaService } from './sla.service';

@Controller('sla')
@UseGuards(JwtAuthGuard)
export class SlaController {
  constructor(private slaService: SlaService) {}

  @Get('metrics')
  getMetrics() {
    return this.slaService.getMetrics();
  }

  @Get('cases/close-to-deadline')
  getCasesCloseToDeadline(@Query('days') days?: number) {
    return this.slaService.getCasesCloseToDeadline(days ? parseInt(days.toString()) : 1);
  }

  @Get('cases/due')
  getDueCases() {
    return this.slaService.getDueCases();
  }

  @Get('cases/stalled')
  getStalledCases(@Query('days') days?: number) {
    return this.slaService.getStalledCases(days ? parseInt(days.toString()) : 3);
  }

  @Post('check-alerts')
  checkAlerts() {
    return this.slaService.checkSLAAlerts();
  }
}

