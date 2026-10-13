import { ShopProduct } from '../shop/entities/shop-product.entity';

export const getMobileSentrixVisibility = (
  existing?: Pick<ShopProduct, 'is_active'> | null,
): boolean => existing?.is_active ?? false;
