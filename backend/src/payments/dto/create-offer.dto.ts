import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsInt,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { ResultType } from '../../cases/entities/service-case.entity';
import { PaymentMethod } from '../entities/case-payment.entity';

export class CreateOfferDto {
  @IsEnum(['covered', 'payable', 'returned', 'replaceable'])
  offer_type: ResultType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offer_amount?: number;

  @IsOptional()
  @IsEnum(['onsite', 'online'])
  payment_method?: PaymentMethod;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  estimated_days_after_payment?: number;

  @IsOptional()
  @IsString()
  replacement_product_title?: string;
}

