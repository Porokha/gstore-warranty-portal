import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WooCommerceService } from './woocommerce.service';
import { WooCommerceController } from './woocommerce.controller';
import { Warranty } from '../warranties/entities/warranty.entity';
import { WarrantiesModule } from '../warranties/warranties.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Warranty]),
    WarrantiesModule,
  ],
  controllers: [WooCommerceController],
  providers: [WooCommerceService],
  exports: [WooCommerceService],
})
export class WooCommerceModule {}

