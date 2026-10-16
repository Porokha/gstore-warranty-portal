import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopProduct } from './entities/shop-product.entity';
import { ShopOrder } from './entities/shop-order.entity';
import { ShopPaymentAttempt } from './entities/shop-payment-attempt.entity';
import { ShopPaymentEvent } from './entities/shop-payment-event.entity';
import { SettingsModule } from '../settings/settings.module';
import { ShopPaymentsService } from './shop-payments.service';
import { ShopPublicController } from './shop-public.controller';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';

@Module({
  imports: [TypeOrmModule.forFeature([ShopProduct, ShopOrder, ShopPaymentAttempt, ShopPaymentEvent]), SettingsModule],
  controllers: [ShopController, ShopPublicController],
  providers: [ShopService, ShopPaymentsService],
  exports: [ShopService],
})
export class ShopModule {}
