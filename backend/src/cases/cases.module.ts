import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';
import { ServiceCase } from './entities/service-case.entity';
import { CaseStatusHistory } from './entities/case-status-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceCase, CaseStatusHistory])],
  controllers: [CasesController],
  providers: [CasesService],
  exports: [CasesService],
})
export class CasesModule {}

