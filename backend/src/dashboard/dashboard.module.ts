import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { ServiceCase } from '../cases/entities/service-case.entity';
import { Warranty } from '../warranties/entities/warranty.entity';
import { CasePayment } from '../payments/entities/case-payment.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceCase, Warranty, CasePayment]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

