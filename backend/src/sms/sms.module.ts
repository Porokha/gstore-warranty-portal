import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';
import { SmsTemplate } from './entities/sms-template.entity';
import { SmsSettings } from './entities/sms-settings.entity';
import { SmsLog } from './entities/sms-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SmsTemplate, SmsSettings, SmsLog])],
  controllers: [SmsController],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}

