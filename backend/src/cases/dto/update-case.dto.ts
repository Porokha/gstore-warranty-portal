import { IsString, IsOptional, IsInt, IsEnum, IsArray, IsDateString } from 'class-validator';
import { Priority } from '../entities/service-case.entity';

export class UpdateCaseDto {
  @IsOptional()
  @IsString()
  product_title?: string;

  @IsOptional()
  @IsString()
  customer_name?: string;

  @IsOptional()
  @IsString()
  customer_last_name?: string;

  @IsOptional()
  @IsString()
  customer_phone?: string;

  @IsOptional()
  @IsString()
  customer_email?: string;

  @IsOptional()
  @IsString()
  customer_initial_note?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  serial_number?: string;

  @IsOptional()
  @IsString()
  imei?: string;

  @IsOptional()
  @IsString()
  device_type?: string;

  @IsOptional()
  @IsInt()
  warranty_id?: number;

  @IsOptional()
  @IsInt()
  order_id?: number;

  @IsOptional()
  @IsInt()
  product_id?: number;

  @IsOptional()
  @IsInt()
  assigned_technician_id?: number;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsDateString()
  deadline_at?: string;
}

