import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { PartnersService } from './partners.service';

@Controller('partners')
@UseGuards(JwtAuthGuard)
export class PartnersController {
  constructor(private partnersService: PartnersService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.partnersService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.partnersService.findOne(id);
  }

  @Get(':id/cases')
  getCases(@Param('id', ParseIntPipe) id: number) {
    return this.partnersService.getCases(id);
  }

  @Post()
  create(@Body() createDto: CreatePartnerDto) {
    return this.partnersService.create(createDto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdatePartnerDto) {
    return this.partnersService.update(id, updateDto);
  }
}
