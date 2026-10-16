import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post, Query, Req } from '@nestjs/common';
import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { ShopPaymentsService } from './shop-payments.service';
import { CreatePublicShopOrderDto } from './dto/create-public-shop-order.dto';
import { PublicShopProductsDto } from './dto/public-shop-products.dto';
import { ShopService } from './shop.service';

@Controller('public/shop')
export class ShopPublicController {
  constructor(private readonly shopService: ShopService, private readonly payments: ShopPaymentsService) {}

  @Get('payment-methods')
  paymentMethods() { return this.payments.methods(); }

  @Get('payments/status')
  paymentStatus(@Query('order') order: string, @Query('token') token: string) {
    return this.payments.publicStatus(order, token);
  }

  @Post('payments/bog/callback')
  @HttpCode(HttpStatus.OK)
  bogCallback(@Req() req: RawBodyRequest<Request>, @Headers('callback-signature') signature: string) {
    return this.payments.callback(req.rawBody, signature);
  }

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
