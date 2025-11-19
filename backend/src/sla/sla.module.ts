import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlaService } from './sla.service';
import { SlaController } from './sla.controller';
import { ServiceCase } from '../cases/entities/service-case.entity';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceCase]),
    SmsModule,
  ],
  controllers: [SlaController],
  providers: [SlaService],
  exports: [SlaService],
})
export class SlaModule {}

