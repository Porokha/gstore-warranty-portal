import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { TradeInQuoteStatus } from '../entities/trade-in-quote.entity';

export class UpdateTradeInQuoteDto {
  @IsOptional()
  @IsEnum(TradeInQuoteStatus)
  status?: TradeInQuoteStatus;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  customer_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  customer_email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  customer_phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  product_name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  final_price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}
