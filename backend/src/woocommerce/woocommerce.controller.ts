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
  Req,
  RawBodyRequest,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { WooCommerceService, WooCommerceOrder, WooCommerceProduct } from './woocommerce.service';

@Controller('woocommerce')
export class WooCommerceController {
  private readonly logger = new Logger(WooCommerceController.name);

  constructor(private wooCommerceService: WooCommerceService, private configService: ConfigService) {}

  @Post('webhook/order')
  @HttpCode(HttpStatus.OK)
  async handleOrderWebhook(@Body() body: { id: number; status: string }, @Req() req: RawBodyRequest<Request>) {
    const secret = this.configService.get<string>('WOOCOMMERCE_WEBHOOK_SECRET');
    if (!secret) throw new ServiceUnavailableException('WooCommerce webhook is not configured');
    const supplied = req.header('x-wc-webhook-signature') || '';
    const expected = createHmac('sha256', secret).update(req.rawBody || Buffer.alloc(0)).digest();
    const actual = Buffer.from(supplied, 'base64');
    if (!req.rawBody || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      throw new UnauthorizedException('Invalid WooCommerce webhook signature');
    }
    await this.wooCommerceService.processOrderWebhook(body.id, body.status);
    return { success: true };
  }

  @Post('sync/order/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getSyncProgress(@Param('jobId') jobId: string) {
    return this.wooCommerceService.getSyncProgress(jobId);
  }

  @Post('sync/cancel/:jobId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  cancelSync(@Param('jobId') jobId: string) {
    return this.wooCommerceService.cancelSync(jobId);
  }
}

