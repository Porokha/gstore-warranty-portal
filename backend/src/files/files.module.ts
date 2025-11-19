import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { CaseFile } from './entities/case-file.entity';
import { ServiceCase } from '../cases/entities/service-case.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CaseFile, ServiceCase])],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}

