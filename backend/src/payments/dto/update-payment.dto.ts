import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';
import { PaymentStatus } from '../entities/case-payment.entity';

export class UpdatePaymentDto {
  @IsOptional()
  @IsEnum(['pending', 'paid', 'failed'])
  payment_status?: PaymentStatus;

  @IsOptional()
  @IsString()
  bog_transaction_id?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offer_amount?: number;
}

