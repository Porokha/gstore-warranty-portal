import { IsBoolean, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class GstoreOfferProductDto {
  @IsString()
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  subtitle?: string;

  @IsString()
  @MaxLength(500)
  image_url: string;

  @IsNumber()
  @Min(0)
  @Max(1000000)
  price_gel: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bonus_percent?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000)
  bonus_fixed?: number | null;

  @IsBoolean()
  enabled: boolean;
}
