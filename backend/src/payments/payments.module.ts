import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { CasePayment } from './entities/case-payment.entity';
import { ServiceCase } from '../cases/entities/service-case.entity';
import { SmsModule } from '../sms/sms.module';
import { CasesModule } from '../cases/cases.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CasePayment, ServiceCase]),
    SmsModule,
    CasesModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}

