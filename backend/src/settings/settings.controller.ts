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

  constructor(private settingsService: SettingsService) {
    this.logger.log('SettingsController initialized');
  }

    @Get('api-keys')
    async getApiKeys() {
      this.logger.log('GET /api/settings/api-keys - Retrieving API keys');
      const keys = await this.settingsService.getApiKeys();
      this.logger.log(`📋 Retrieved API keys - URL: ${keys.woocommerce_url ? `set (${keys.woocommerce_url})` : 'missing'}, Key: ${keys.woocommerce_consumer_key ? `set (${keys.woocommerce_consumer_key.length} chars)` : 'missing'}, Secret: ${keys.woocommerce_consumer_secret ? `set (${keys.woocommerce_consumer_secret.length} chars)` : 'missing'}`);
      return keys;
    }

    @Post('api-keys')
    async setApiKeys(@Body() keys: any) {
      this.logger.log('💾 POST /api/settings/api-keys - Saving API keys');
      this.logger.log('📥 Received keys:', {
        hasUrl: !!keys.woocommerce_url,
        hasKey: !!keys.woocommerce_consumer_key,
        hasSecret: !!keys.woocommerce_consumer_secret,
        url: keys.woocommerce_url || 'MISSING',
        keyLength: keys.woocommerce_consumer_key?.length || 0,
        secretLength: keys.woocommerce_consumer_secret?.length || 0,
      });
      
      try {
        await this.settingsService.setApiKeys(keys);
        this.logger.log('✅ API keys saved to database');
        
        // Verify the keys were saved
        const saved = await this.settingsService.getApiKeys();
        this.logger.log(`🔍 Verified saved keys - URL: ${saved.woocommerce_url ? `set (${saved.woocommerce_url})` : 'missing'}, Key: ${saved.woocommerce_consumer_key ? `set (${saved.woocommerce_consumer_key.length} chars)` : 'missing'}, Secret: ${saved.woocommerce_consumer_secret ? `set (${saved.woocommerce_consumer_secret.length} chars)` : 'missing'}`);
        
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
        this.logger.error('❌ Failed to save API keys:', error);
        this.logger.error('Error details:', error.message, error.stack);
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

