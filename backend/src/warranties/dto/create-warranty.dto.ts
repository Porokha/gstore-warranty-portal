import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsNumber,
  IsDateString,
  IsEnum,
  IsUrl,
} from 'class-validator';
import { CreatedSource } from '../entities/warranty.entity';

export class CreateWarrantyDto {
  @IsOptional()
  @IsInt()
  order_id?: number;

  @IsOptional()
  @IsInt()
  product_id?: number;

  @IsOptional()
  @IsInt()
  order_line_index?: number;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsOptional()
  @IsString()
  imei?: string;

  @IsString()
  @IsNotEmpty()
  serial_number: string;

  @IsString()
  @IsNotEmpty()
  device_type: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsUrl()
  thumbnail_url?: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsNotEmpty()
  customer_name: string;

  @IsString()
  @IsNotEmpty()
  customer_last_name: string;

  @IsString()
  @IsNotEmpty()
  customer_phone: string;

  @IsOptional()
  @IsString()
  customer_email?: string;

  @IsDateString()
  @IsNotEmpty()
  purchase_date: string;

  @IsDateString()
  @IsNotEmpty()
  warranty_start: string;

  @IsDateString()
  @IsNotEmpty()
  warranty_end: string;

  @IsOptional()
  @IsNumber()
  extended_days?: number;

  @IsOptional()
  @IsEnum(CreatedSource)
  created_source?: CreatedSource;
}

