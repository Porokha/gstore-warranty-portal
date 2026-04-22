import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ShopOrderStatus } from '../entities/shop-order.entity';

export class UpdateShopOrderDto {
  @IsOptional()
  @IsEnum(ShopOrderStatus)
  status?: ShopOrderStatus;

  @IsOptional()
  @IsString()
  admin_note?: string;

  @IsOptional()
  @IsString()
  payment_method?: string;

  @IsOptional()
  @IsBoolean()
  viewed?: boolean;
}
