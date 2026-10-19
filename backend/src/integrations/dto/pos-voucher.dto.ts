import { Transform, Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

const normalizedCode = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toUpperCase() : value;

export class PosVoucherValidateDto {
  @Transform(normalizedCode)
  @IsString()
  @Matches(/^[A-Z0-9]{8}$/)
  code: string;
}

export class PosVoucherRedeemDto extends PosVoucherValidateDto {
  @IsString()
  @Matches(/^[A-Za-z0-9._:-]{1,120}$/)
  order_id: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  order_number?: string;

  @IsIn(['pos-success', 'completed'])
  order_status: 'pos-success' | 'completed';

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  order_total_gel: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  applied_amount_gel: number;
}
