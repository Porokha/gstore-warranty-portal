import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  ShopDeviceCategory,
} from '../entities/shop-product.entity';

export class PublicShopProductsDto {
  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsEnum(ShopDeviceCategory)
  device?: ShopDeviceCategory;

  @IsOptional()
  @IsString()
  part?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(120)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  price_min?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  price_max?: number;
}
