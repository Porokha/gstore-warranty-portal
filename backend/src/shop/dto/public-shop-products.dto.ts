import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  ShopDeviceCategory,
  ShopInventorySource,
  ShopPartCategory,
} from '../entities/shop-product.entity';

export class PublicShopProductsDto {
  @IsOptional()
  @IsEnum(ShopDeviceCategory)
  device?: ShopDeviceCategory;

  @IsOptional()
  @IsEnum(ShopPartCategory)
  part?: ShopPartCategory;

  @IsOptional()
  @IsEnum(ShopInventorySource)
  source?: ShopInventorySource;

  @IsOptional()
  @IsString()
  search?: string;
}
