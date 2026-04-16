import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopProduct } from './entities/shop-product.entity';
import { ShopOrder } from './entities/shop-order.entity';
import { ShopPublicController } from './shop-public.controller';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';

@Module({
  imports: [TypeOrmModule.forFeature([ShopProduct, ShopOrder])],
  controllers: [ShopController, ShopPublicController],
  providers: [ShopService],
  exports: [ShopService],
})
export class ShopModule {}
