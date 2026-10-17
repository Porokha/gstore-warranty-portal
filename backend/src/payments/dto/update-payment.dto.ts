import {
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

export class UpdatePaymentDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  offer_amount?: number;
}

