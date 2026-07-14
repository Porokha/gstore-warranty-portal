import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class GenerateCodeDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  estimated_days_after_payment?: number;
}
