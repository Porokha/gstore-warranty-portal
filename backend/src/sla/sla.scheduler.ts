import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SlaService } from './sla.service';

@Injectable()
export class SlaScheduler {
  private readonly logger = new Logger(SlaScheduler.name);

  constructor(private slaService: SlaService) {}

  // Run every hour to check for SLA alerts
  @Cron(CronExpression.EVERY_HOUR)
  async handleSLAAlerts() {
    this.logger.log('Running SLA alert check...');
    try {
      await this.slaService.checkSLAAlerts();
      this.logger.log('SLA alert check completed');
    } catch (error) {
      this.logger.error('Error during SLA alert check:', error.message);
    }
  }
}

