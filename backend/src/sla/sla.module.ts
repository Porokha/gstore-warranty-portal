import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SlaService } from './sla.service';
import { SlaController } from './sla.controller';
import { SlaScheduler } from './sla.scheduler';
import { ServiceCase } from '../cases/entities/service-case.entity';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceCase]),
    SmsModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [SlaController],
  providers: [SlaService, SlaScheduler],
  exports: [SlaService],
})
export class SlaModule {}
