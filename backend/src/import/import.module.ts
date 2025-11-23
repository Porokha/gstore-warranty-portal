import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { ServiceCase } from '../cases/entities/service-case.entity';
import { Warranty } from '../warranties/entities/warranty.entity';
import { CasesModule } from '../cases/cases.module';
import { WarrantiesModule } from '../warranties/warranties.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceCase, Warranty]),
    CasesModule,
    WarrantiesModule,
  ],
  controllers: [ImportController],
  providers: [ImportService],
  exports: [ImportService],
})
export class ImportModule {}

