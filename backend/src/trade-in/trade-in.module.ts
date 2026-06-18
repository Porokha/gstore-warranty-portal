import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TradeInCategory } from './entities/trade-in-category.entity';
import { TradeInPricingTree } from './entities/trade-in-pricing-tree.entity';
import { TradeInProduct } from './entities/trade-in-product.entity';
import { TradeInQuote } from './entities/trade-in-quote.entity';
import { TradeInSetting } from './entities/trade-in-setting.entity';
import { TradeInAdminController } from './trade-in-admin.controller';
import { TradeInPublicController } from './trade-in-public.controller';
import { TradeInService } from './trade-in.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TradeInCategory,
      TradeInProduct,
      TradeInPricingTree,
      TradeInQuote,
      TradeInSetting,
    ]),
  ],
  controllers: [TradeInPublicController, TradeInAdminController],
  providers: [TradeInService],
})
export class TradeInModule {}
