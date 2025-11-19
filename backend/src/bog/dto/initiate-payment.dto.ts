import { IsNumber, IsString, IsNotEmpty, IsOptional, Min } from 'class-validator';

export class InitiatePaymentDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  customer_first_name?: string;

  @IsString()
  @IsOptional()
  customer_last_name?: string;

  @IsString()
  @IsOptional()
  customer_phone?: string;

  @IsString()
  @IsOptional()
  customer_email?: string;
}

