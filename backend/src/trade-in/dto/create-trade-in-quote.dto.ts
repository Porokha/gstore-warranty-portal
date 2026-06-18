import {
  IsArray,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTradeInQuoteDto {
  @IsString()
  @MaxLength(255)
  product_slug: string;

  @IsNumber()
  @Min(0)
  final_price: number;

  @IsOptional()
  @IsArray()
  pricing_path?: any[];

  @IsString()
  @MaxLength(255)
  customer_name: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  customer_email?: string;

  @IsString()
  @MaxLength(60)
  customer_phone: string;
}
