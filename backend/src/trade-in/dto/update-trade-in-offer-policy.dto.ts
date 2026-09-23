import { IsNumber, Max, Min } from 'class-validator';

export class UpdateTradeInOfferPolicyDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  bonus_percent: number;

  @IsNumber()
  @Min(0)
  @Max(100000)
  bonus_fixed: number;
}
