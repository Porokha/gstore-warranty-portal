import { Controller, Get, Post, Body, UseGuards, RolesGuard, Roles } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
    await this.settingsService.setApiKeys(keys);
    return { success: true, message: 'API keys updated successfully' };
  }
}

