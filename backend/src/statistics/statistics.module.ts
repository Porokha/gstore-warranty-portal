import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { ServiceCase } from '../cases/entities/service-case.entity';
import { User } from '../users/entities/user.entity';
import { CasePayment } from '../payments/entities/case-payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceCase, User, CasePayment])],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}

