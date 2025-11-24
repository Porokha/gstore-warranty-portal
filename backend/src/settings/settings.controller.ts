import { Controller, Get, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SettingsController {
  private readonly logger = new Logger(SettingsController.name);

  constructor(private settingsService: SettingsService) {}

  @Get('api-keys')
  async getApiKeys() {
    this.logger.log('GET /api/settings/api-keys - Retrieving API keys');
    const keys = await this.settingsService.getApiKeys();
    this.logger.log(`Retrieved API keys - URL: ${keys.woocommerce_url ? 'set' : 'missing'}, Key: ${keys.woocommerce_consumer_key ? 'set' : 'missing'}, Secret: ${keys.woocommerce_consumer_secret ? 'set' : 'missing'}`);
    return keys;
  }

  @Post('api-keys')
  async setApiKeys(@Body() keys: any) {
    this.logger.log('POST /api/settings/api-keys - Saving API keys');
    this.logger.debug('Received keys:', {
      hasUrl: !!keys.woocommerce_url,
      hasKey: !!keys.woocommerce_consumer_key,
      hasSecret: !!keys.woocommerce_consumer_secret,
      url: keys.woocommerce_url ? `${keys.woocommerce_url.substring(0, 20)}...` : 'none',
    });
    
    try {
      await this.settingsService.setApiKeys(keys);
      this.logger.log('API keys saved to database');
      
      // Verify the keys were saved
      const saved = await this.settingsService.getApiKeys();
      this.logger.log(`Verified saved keys - URL: ${saved.woocommerce_url ? 'set' : 'missing'}, Key: ${saved.woocommerce_consumer_key ? 'set' : 'missing'}, Secret: ${saved.woocommerce_consumer_secret ? 'set' : 'missing'}`);
      
      return { 
        success: true, 
        message: 'API keys updated successfully',
        saved: {
          hasUrl: !!saved.woocommerce_url,
          hasKey: !!saved.woocommerce_consumer_key,
          hasSecret: !!saved.woocommerce_consumer_secret,
        }
      };
    } catch (error) {
      this.logger.error('Failed to save API keys:', error);
      throw new Error(`Failed to save API keys: ${error.message}`);
    }
  }

  @Get('woocommerce-automation')
  async getWooCommerceAutomation() {
    const enabled = await this.settingsService.get('WOOCOMMERCE_AUTOMATION_ENABLED');
    return { enabled: enabled === 'true' };
  }

  @Post('woocommerce-automation')
  async setWooCommerceAutomation(@Body() body: { enabled: boolean }) {
    await this.settingsService.set(
      'WOOCOMMERCE_AUTOMATION_ENABLED',
      body.enabled ? 'true' : 'false',
      'Enable/disable automatic warranty creation from WooCommerce completed orders'
    );
    return { success: true, message: 'WooCommerce automation setting updated successfully' };
  }
}

