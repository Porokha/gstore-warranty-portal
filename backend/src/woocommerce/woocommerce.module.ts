import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WooCommerceService } from './woocommerce.service';
import { WooCommerceController } from './woocommerce.controller';
import { Warranty } from '../warranties/entities/warranty.entity';
import { WarrantiesModule } from '../warranties/warranties.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Warranty]),
    WarrantiesModule,
    SettingsModule,
  ],
  controllers: [WooCommerceController],
  providers: [WooCommerceService],
  exports: [WooCommerceService],
})
export class WooCommerceModule {}

