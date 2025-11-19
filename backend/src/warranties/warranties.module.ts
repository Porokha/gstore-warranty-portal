import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarrantiesService } from './warranties.service';
import { WarrantiesController } from './warranties.controller';
import { Warranty } from './entities/warranty.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Warranty])],
  controllers: [WarrantiesController],
  providers: [WarrantiesService],
  exports: [WarrantiesService],
})
export class WarrantiesModule {}

