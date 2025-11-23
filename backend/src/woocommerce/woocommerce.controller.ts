import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WooCommerceService, WooCommerceOrder, WooCommerceProduct } from './woocommerce.service';

@Controller('woocommerce')
export class WooCommerceController {
  constructor(private wooCommerceService: WooCommerceService) {}

  @Post('webhook/order')
  @HttpCode(HttpStatus.OK)
  async handleOrderWebhook(@Body() body: { id: number; status: string }) {
    // This endpoint should be publicly accessible for WooCommerce webhooks
    // In production, add webhook signature verification
    await this.wooCommerceService.processOrderWebhook(body.id, body.status);
    return { success: true };
  }

  @Post('sync/order/:orderId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async syncOrder(@Param('orderId', ParseIntPipe) orderId: number) {
    const warranties = await this.wooCommerceService.syncOrder(orderId);
    return {
      success: true,
      warranties,
      count: warranties.length,
    };
  }

  @Post('create-warranty/:orderId')
  @UseGuards(JwtAuthGuard)
  async createWarranty(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Query('lineItemIndex') lineItemIndex?: number,
  ) {
    const index = lineItemIndex ? parseInt(lineItemIndex.toString()) : 0;
    const warranty = await this.wooCommerceService.createWarrantyFromOrder(orderId, index);
    return warranty;
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  async getOrder(@Param('orderId', ParseIntPipe) orderId: number): Promise<WooCommerceOrder> {
    return this.wooCommerceService.getOrder(orderId);
  }

  @Get('product/:productId')
  @UseGuards(JwtAuthGuard)
  async getProduct(@Param('productId', ParseIntPipe) productId: number): Promise<WooCommerceProduct> {
    return this.wooCommerceService.getProduct(productId);
  }

  @Post('sync/orders')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async syncOrders(
    @Body() body: { 
      statuses?: string[]; 
      limit?: number;
      dateFrom?: string;
      skipDuplicates?: boolean;
    },
  ) {
    const statuses = body.statuses || ['completed'];
    const result = await this.wooCommerceService.syncOrdersByStatus(statuses, {
      limit: body.limit,
      dateFrom: body.dateFrom,
      skipDuplicates: body.skipDuplicates ?? true,
    });
    return result;
  }
}

