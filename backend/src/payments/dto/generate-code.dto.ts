import { IsInt, Min, Max } from 'class-validator';

export class GenerateCodeDto {
  @IsInt()
  @Min(1)
  @Max(365)
  estimated_days_after_payment: number;
}

