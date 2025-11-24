import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('api-keys')
  async getApiKeys() {
    return this.settingsService.getApiKeys();
  }

  @Post('api-keys')
  async setApiKeys(@Body() keys: any) {
    try {
      await this.settingsService.setApiKeys(keys);
      // Verify the keys were saved
      const saved = await this.settingsService.getApiKeys();
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

