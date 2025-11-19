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
  customer_phone?: string;

  @IsOptional()
  @IsString()
  customer_email?: string;

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

