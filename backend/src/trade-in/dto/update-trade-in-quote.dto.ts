import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TradeInQuoteStatus } from '../entities/trade-in-quote.entity';

export class UpdateTradeInQuoteDto {
  @IsOptional()
  @IsEnum(TradeInQuoteStatus)
  status?: TradeInQuoteStatus;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}
