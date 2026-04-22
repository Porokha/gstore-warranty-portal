import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  ShopDeviceCategory,
  ShopInventorySource,
  ShopPartCategory,
} from '../entities/shop-product.entity';

export class CreateShopProductDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @IsEnum(ShopDeviceCategory)
  device_category: ShopDeviceCategory;

  @IsEnum(ShopPartCategory)
  part_category: ShopPartCategory;

  @IsEnum(ShopInventorySource)
  inventory_source: ShopInventorySource;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  issue_label?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  image_url?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sale_price?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  service_price?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock_quantity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
