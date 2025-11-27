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
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WooCommerceService, WooCommerceOrder, WooCommerceProduct } from './woocommerce.service';

@Controller('woocommerce')
export class WooCommerceController {
  private readonly logger = new Logger(WooCommerceController.name);

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
    this.logger.log('🚀 POST /api/woocommerce/sync/orders - Starting sync');
    this.logger.log('📦 Sync request body:', { 
      statuses: body.statuses, 
      limit: body.limit,
      hasDateFrom: !!body.dateFrom,
      skipDuplicates: body.skipDuplicates,
    });
    
    // Store sync job ID for progress tracking
    const jobId = `sync-${Date.now()}`;
    
    const startTime = Date.now();
    const statuses = body.statuses || ['completed'];
    
    // Run sync in background and return immediately with job ID
    this.wooCommerceService.syncOrdersByStatus(statuses, {
      limit: body.limit,
      dateFrom: body.dateFrom,
      skipDuplicates: body.skipDuplicates ?? true,
    }, jobId).then((result) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log(`✅ Sync completed in ${duration}s - Imported: ${result.imported}, Skipped: ${Array.isArray(result.skipped) ? result.skipped.length : result.skipped || 0}`);
    }).catch((error) => {
      this.logger.error(`❌ Sync failed: ${error.message}`);
    });
    
    return { 
      success: true, 
      jobId,
      message: 'Import started. Use the progress endpoint to track status.',
    };
  }

  @Get('sync/progress/:jobId')
  @UseGuards(JwtAuthGuard)
  getSyncProgress(@Param('jobId') jobId: string) {
    return this.wooCommerceService.getSyncProgress(jobId);
  }

  @Post('sync/cancel/:jobId')
  @UseGuards(JwtAuthGuard)
  cancelSync(@Param('jobId') jobId: string) {
    return this.wooCommerceService.cancelSync(jobId);
  }
}

