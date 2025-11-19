import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BogService } from './bog.service';
import { BogController } from './bog.controller';
import { CasePayment } from '../payments/entities/case-payment.entity';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CasePayment]),
    PaymentsModule,
  ],
  controllers: [BogController],
  providers: [BogService],
  exports: [BogService],
})
export class BogModule {}

