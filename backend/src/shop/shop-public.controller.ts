import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { CreatePublicShopOrderDto } from './dto/create-public-shop-order.dto';
import { PublicShopProductsDto } from './dto/public-shop-products.dto';
import { ShopService } from './shop.service';

@Controller('public/shop')
export class ShopPublicController {
  constructor(private readonly shopService: ShopService) {}

  @Get('products')
  listProducts(@Query() filters: PublicShopProductsDto) {
    return this.shopService.listPublicProducts(filters);
  }

  @Get('facets')
  listFacets(@Query() filters: PublicShopProductsDto) {
    return this.shopService.getPublicProductFacets(filters);
  }

  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  createOrder(@Body() createDto: CreatePublicShopOrderDto) {
    return this.shopService.createPublicOrder(createDto);
  }
}
