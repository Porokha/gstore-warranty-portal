import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, IsArray, ValidateIf } from 'class-validator';
import { Priority } from '../entities/service-case.entity';

export class CreateCaseDto {
  @IsOptional()
  @IsInt()
  warranty_id?: number;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.device_type === 'phone')
  @IsNotEmpty({ message: 'IMEI is required for phones' })
  imei?: string;

  @IsString()
  @IsNotEmpty()
  serial_number: string;

  @IsString()
  @IsNotEmpty()
  device_type: string;

  @IsString()
  @IsNotEmpty()
  product_title: string;

  @IsString()
  @IsNotEmpty()
  customer_name: string;

  @IsOptional()
  @IsString()
  customer_last_name?: string;

  @IsString()
  @IsNotEmpty()
  customer_phone: string;

  @IsOptional()
  @IsString()
  customer_email?: string;

  @IsOptional()
  @IsString()
  customer_initial_note?: string; // Customer's description of the problem

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
  @IsInt()
  deadline_days?: number; // Days from now to set deadline
}

