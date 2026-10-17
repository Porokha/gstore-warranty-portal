import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';
import { ServiceCase } from './entities/service-case.entity';
import { CaseStatusHistory } from './entities/case-status-history.entity';
import { Partner } from '../partners/entities/partner.entity';
import { UsersModule } from '../users/users.module';
import { SmsModule } from '../sms/sms.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CasePickup } from './entities/case-pickup.entity';
import { PickupService } from './pickup.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceCase, CaseStatusHistory, CasePickup, Partner]),
    UsersModule,
    SmsModule,
    AuditModule,
    NotificationsModule,
  ],
  controllers: [CasesController],
  providers: [CasesService, PickupService],
  exports: [CasesService, PickupService],
})
export class CasesModule {}
