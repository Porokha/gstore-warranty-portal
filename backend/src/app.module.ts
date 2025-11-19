import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CasesModule } from './cases/cases.module';
import { WarrantiesModule } from './warranties/warranties.module';
import { PaymentsModule } from './payments/payments.module';
import { FilesModule } from './files/files.module';
import { SmsModule } from './sms/sms.module';
import { AuditModule } from './audit/audit.module';
import { PublicModule } from './public/public.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { WooCommerceModule } from './woocommerce/woocommerce.module';
import { DatabaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    AuthModule,
    UsersModule,
    CasesModule,
    WarrantiesModule,
    PaymentsModule,
    FilesModule,
    SmsModule,
    AuditModule,
    PublicModule,
    DashboardModule,
    WooCommerceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

