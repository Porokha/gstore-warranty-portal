import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { WarrantiesModule } from '../warranties/warranties.module';
import { CasesModule } from '../cases/cases.module';

@Module({
  imports: [WarrantiesModule, CasesModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}

