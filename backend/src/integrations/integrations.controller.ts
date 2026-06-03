import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { PosOrderUpsertDto } from './dto/pos-order-upsert.dto';
import { IntegrationsService } from './integrations.service';

@Controller('integrations')
export class IntegrationsController {
  private readonly logger = new Logger(IntegrationsController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly integrationsService: IntegrationsService,
  ) {}

  @Post('mobilesentrix/oauth/connect')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async connectMobileSentrix() {
    return this.integrationsService.connectMobileSentrix();
  }

  @Get('mobilesentrix/oauth/callback')
  async handleMobileSentrixOAuthCallback(
    @Query('oauth_token') oauthToken?: string,
    @Query('oauth_verifier') oauthVerifier?: string,
    @Res() res?: Response,
  ) {
    try {
      await this.integrationsService.completeMobileSentrixOAuthFromCallback(
        oauthToken,
        oauthVerifier,
      );
      return res?.redirect('/staff/settings?mobilesentrix=connected');
    } catch (error) {
      this.logger.error(`MobileSentrix OAuth callback failed: ${error.message}`);
      return res?.redirect('/staff/settings?mobilesentrix=failed');
    }
  }

  @Get('mobilesentrix/test-search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async testMobileSentrixSearch(@Query('q') q?: string) {
    return this.integrationsService.testMobileSentrixSearch(q || 'iphone lcd');
  }

  @Get('mobilesentrix/products/preview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async previewMobileSentrixProducts(
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.integrationsService.previewMobileSentrixProducts(
      Number(limit || 10),
      Number(page || 1),
    );
  }

  @Post('mobilesentrix/products/sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async syncMobileSentrixProducts(
    @Body()
    body: {
      limit?: number;
      start_page?: number;
      max_pages?: number;
    },
  ) {
    return this.integrationsService.syncMobileSentrixProducts(
      Number(body.limit || 100),
      Number(body.start_page || 1),
      body.max_pages ? Number(body.max_pages) : undefined,
    );
  }

  @Post('mobilesentrix/products/refresh-existing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async refreshExistingMobileSentrixProducts() {
    return this.integrationsService.refreshExistingMobileSentrixProducts();
  }

  @Post('mobilesentrix/webhook')
  @HttpCode(HttpStatus.OK)
  async handleMobileSentrixWebhook(
    @Body() payload: Record<string, any>,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: Record<string, string | string[]>,
  ) {
    const headerNames = Object.keys(headers || {});
    const payloadKeys = Object.keys(payload || {});

    this.logger.log(
      `MobileSentrix webhook received. Headers: ${headerNames.join(', ') || 'none'}, payload keys: ${payloadKeys.join(', ') || 'none'}`,
    );

    this.logger.debug(
      JSON.stringify({
        query,
        headers,
        payload,
      }),
    );

    return {
      success: true,
      received: true,
      callback: `${this.configService.get<string>('PORTAL_URL') || 'https://zezva.ge'}/api/integrations/mobilesentrix/webhook`,
    };
  }

  @Post('pos/order-upsert')
  @HttpCode(HttpStatus.OK)
  async handlePosOrderUpsert(
    @Body() payload: PosOrderUpsertDto,
    @Headers('authorization') authorization?: string,
  ) {
    await this.integrationsService.assertPosWebhookAuthorization(authorization);
    return this.integrationsService.handlePosOrderUpsert(payload);
  }
}
