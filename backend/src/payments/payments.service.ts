import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CasePayment } from './entities/case-payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(CasePayment)
    private paymentsRepository: Repository<CasePayment>,
  ) {}
}

