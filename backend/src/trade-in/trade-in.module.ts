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
import { TradeInAgreement } from './entities/trade-in-agreement.entity';
import { TradeInStaffSignature } from './entities/trade-in-staff-signature.entity';
import { TradeInStaffSigningLink } from './entities/trade-in-staff-signing-link.entity';
import { TradeInStaffSignatureProfile } from './entities/trade-in-staff-signature-profile.entity';
import { User } from '../users/entities/user.entity';
import { TradeInAgreementService } from './trade-in-agreement.service';
import { TradeInVoucher } from './entities/trade-in-voucher.entity';
import { TradeInVoucherService } from './trade-in-voucher.service';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [
    SmsModule,
    TypeOrmModule.forFeature([
      TradeInCategory,
      TradeInProduct,
      TradeInPricingTree,
      TradeInQuote,
      TradeInSetting,
      TradeInAgreement,
      TradeInVoucher,
      TradeInStaffSignature,
      TradeInStaffSigningLink,
      TradeInStaffSignatureProfile,
      User,
    ]),
  ],
  controllers: [TradeInPublicController, TradeInAdminController],
  providers: [TradeInService, TradeInAgreementService, TradeInVoucherService],
})
export class TradeInModule {}
