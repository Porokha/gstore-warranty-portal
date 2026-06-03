import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsModule } from '../settings/settings.module';
import { SmsModule } from '../sms/sms.module';
import { WarrantiesModule } from '../warranties/warranties.module';
import { Warranty } from '../warranties/entities/warranty.entity';
import { ShopProduct } from '../shop/entities/shop-product.entity';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { PosWarrantyInboundEvent } from './entities/pos-warranty-inbound-event.entity';
import { MobileSentrixSyncJob } from './entities/mobilesentrix-sync-job.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Warranty, PosWarrantyInboundEvent, ShopProduct, MobileSentrixSyncJob]),
    SettingsModule,
    SmsModule,
    WarrantiesModule,
  ],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
})
export class IntegrationsModule {}
