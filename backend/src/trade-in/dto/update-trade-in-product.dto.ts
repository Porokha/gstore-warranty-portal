import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTradeInProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  image_src?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
