import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WarrantiesService } from './warranties.service';
import { CreateWarrantyDto } from './dto/create-warranty.dto';
import { UpdateWarrantyDto } from './dto/update-warranty.dto';
import { FilterWarrantyDto } from './dto/filter-warranty.dto';

@Controller('warranties')
@UseGuards(JwtAuthGuard)
export class WarrantiesController {
  constructor(private warrantiesService: WarrantiesService) {}

  @Post()
  create(@Body() createDto: CreateWarrantyDto) {
    return this.warrantiesService.create(createDto);
  }

  @Get()
  findAll(@Query() filters: FilterWarrantyDto) {
    return this.warrantiesService.findAll(filters);
  }

  @Get('stats')
  getStats(
    @Query('start') startDate?: string,
    @Query('end') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.warrantiesService.getStats(start, end);
  }

  @Get('warranty-id/:warrantyId')
  findByWarrantyId(@Param('warrantyId') warrantyId: string) {
    return this.warrantiesService.findByWarrantyId(warrantyId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.warrantiesService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateWarrantyDto,
  ) {
    return this.warrantiesService.update(id, updateDto);
  }

  @Post(':id/extend')
  @HttpCode(HttpStatus.OK)
  extendWarranty(
    @Param('id', ParseIntPipe) id: number,
    @Body('days', ParseIntPipe) days: number,
  ) {
    return this.warrantiesService.extendWarranty(id, days);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.warrantiesService.remove(id);
  }
}
