import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SmsService } from './sms.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SendSmsDto } from './dto/send-sms.dto';

@Controller('sms')
@UseGuards(JwtAuthGuard)
export class SmsController {
  constructor(private smsService: SmsService) {}

  @Post('send')
  async sendSms(@Body() sendSmsDto: SendSmsDto) {
    return this.smsService.sendSms({
      phone: sendSmsDto.phone,
      templateKey: sendSmsDto.template_key,
      language: sendSmsDto.language,
      variables: sendSmsDto.variables || {},
    });
  }

  @Get('templates')
  getAllTemplates() {
    return this.smsService.getAllTemplates();
  }

  @Get('templates/:id')
  getTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.smsService.getTemplateById(id);
  }

  @Post('templates')
  createTemplate(
    @Body() createDto: CreateTemplateDto,
    @CurrentUser() user: any,
  ) {
    return this.smsService.createOrUpdateTemplate(
      createDto.key,
      createDto.language,
      createDto.template_text,
      user.id,
    );
  }

  @Put('templates/:key/:language')
  updateTemplate(
    @Param('key') key: string,
    @Param('language') language: string,
    @Body('template_text') templateText: string,
    @CurrentUser() user: any,
  ) {
    return this.smsService.createOrUpdateTemplate(
      key,
      language as any,
      templateText,
      user.id,
    );
  }

  @Get('settings')
  getSettings() {
    return this.smsService.getSettingsConfig();
  }

  @Put('settings')
  updateSettings(
    @Body() updateDto: UpdateSettingsDto,
    @CurrentUser() user: any,
  ) {
    return this.smsService.updateSettings(updateDto, user.id);
  }

  @Get('logs')
  getLogs(@Query('limit') limit?: number) {
    return this.smsService.getLogs(limit ? parseInt(limit.toString()) : 100);
  }
}
