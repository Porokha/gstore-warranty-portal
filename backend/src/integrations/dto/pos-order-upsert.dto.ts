import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsDefined,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

const toOptionalInt = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
};

const toOptionalNumber = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
};

const toBoolean = ({ value }: { value: unknown }) => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }
  return value;
};

export class PosOrderCustomerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  personal_number?: string;
}

export class PosOrderStaffDto {
  @IsOptional()
  @IsString()
  cashier?: string;

  @IsOptional()
  @IsString()
  salesperson?: string;
}

export class PosOrderStoreDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;
}

export class PosOrderItemDto {
  @IsString()
  @IsNotEmpty()
  product_name: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  imei?: string;

  @IsOptional()
  @IsString()
  serial?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @Transform(toOptionalNumber)
  sold_price?: number;
}

export class PosOrderTotalsDto {
  @IsOptional()
  @Transform(toOptionalNumber)
  total_paid?: number;

  @IsOptional()
  @Transform(toOptionalNumber)
  paid_amount?: number;

  @IsOptional()
  @Transform(toOptionalNumber)
  outstanding_amount?: number;
}

export class PosOrderUpsertDto {
  @IsString()
  @IsNotEmpty()
  event_type: string;

  @IsString()
  @IsNotEmpty()
  event_id: string;

  @IsDateString()
  event_time: string;

  @IsString()
  @IsNotEmpty()
  source: string;

  @Transform(toOptionalInt)
  @IsInt()
  @IsDefined()
  woo_order_id: number;

  @IsOptional()
  @Transform(toOptionalInt)
  @IsInt()
  analytics_order_id?: number;

  @IsOptional()
  @IsString()
  order_number?: string;

  @IsString()
  @IsNotEmpty()
  order_status: string;

  @IsOptional()
  @IsString()
  preorder_status?: string;

  @Transform(toBoolean)
  @IsBoolean()
  has_preorder: boolean;

  @IsOptional()
  @IsString()
  payment_type?: string;

  @IsOptional()
  @IsDateString()
  ordered_at?: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => PosOrderCustomerDto)
  customer: PosOrderCustomerDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PosOrderStaffDto)
  staff?: PosOrderStaffDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PosOrderStoreDto)
  store?: PosOrderStoreDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => PosOrderItemDto)
  item: PosOrderItemDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PosOrderTotalsDto)
  totals?: PosOrderTotalsDto;
}
