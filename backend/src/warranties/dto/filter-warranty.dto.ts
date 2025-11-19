import { IsOptional, IsString, IsInt, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterWarrantyDto {
  @IsOptional()
  @IsString()
  search?: string;

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
  @IsString()
  customer_phone?: string;

  @IsOptional()
  @IsString()
  customer_name?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  order_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  product_id?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  active_only?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  expired_only?: boolean;

  @IsOptional()
  @IsDateString()
  purchase_date_from?: string;

  @IsOptional()
  @IsDateString()
  purchase_date_to?: string;

  @IsOptional()
  @IsDateString()
  warranty_end_from?: string;

  @IsOptional()
  @IsDateString()
  warranty_end_to?: string;
}

