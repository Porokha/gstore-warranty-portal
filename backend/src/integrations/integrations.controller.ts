import { Body, Controller, Headers, HttpCode, HttpStatus, Logger, Post, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('integrations')
export class IntegrationsController {
  private readonly logger = new Logger(IntegrationsController.name);

  constructor(private readonly configService: ConfigService) {}

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
}
