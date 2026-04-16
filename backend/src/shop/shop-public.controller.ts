import { Controller, Get, Query } from '@nestjs/common';
import { PublicShopProductsDto } from './dto/public-shop-products.dto';
import { ShopService } from './shop.service';

@Controller('public/shop')
export class ShopPublicController {
  constructor(private readonly shopService: ShopService) {}

  @Get('products')
  listProducts(@Query() filters: PublicShopProductsDto) {
    return this.shopService.listPublicProducts(filters);
  }
}
