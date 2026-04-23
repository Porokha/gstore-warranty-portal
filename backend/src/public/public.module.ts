import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { Warranty } from '../warranties/entities/warranty.entity';
import { ServiceCase } from '../cases/entities/service-case.entity';
import { CaseStatusHistory } from '../cases/entities/case-status-history.entity';
import { ArcadeScore } from './entities/arcade-score.entity';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Warranty, ServiceCase, CaseStatusHistory, ArcadeScore]),
    SettingsModule,
  ],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
