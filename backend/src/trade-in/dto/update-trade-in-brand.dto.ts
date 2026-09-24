import { IsBoolean, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateTradeInBrandDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  category: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  brand: string;

  @IsBoolean()
  coming_soon: boolean;
}
