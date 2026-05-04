import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsModule } from '../settings/settings.module';
import { SmsModule } from '../sms/sms.module';
import { WarrantiesModule } from '../warranties/warranties.module';
import { Warranty } from '../warranties/entities/warranty.entity';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { PosWarrantyInboundEvent } from './entities/pos-warranty-inbound-event.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Warranty, PosWarrantyInboundEvent]),
    SettingsModule,
    SmsModule,
    WarrantiesModule,
  ],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
})
export class IntegrationsModule {}
