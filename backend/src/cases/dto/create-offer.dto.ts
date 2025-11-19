import { IsEnum, IsNumber, IsInt, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ResultType } from '../entities/service-case.entity';
import { PaymentMethod } from '../../payments/entities/case-payment.entity';

export class CreateOfferDto {
  @IsEnum(ResultType)
  offer_type: ResultType; // covered, payable, replaceable

  @IsOptional()
  @ValidateIf((o) => o.offer_type === 'payable' || o.offer_type === 'replaceable')
  @IsNumber()
  offer_amount?: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method?: PaymentMethod;

  @IsOptional()
  @IsInt()
  estimated_days_after_payment?: number;

  @IsOptional()
  @IsString()
  note_public?: string;

  @IsOptional()
  @IsString()
  note_private?: string;
}

