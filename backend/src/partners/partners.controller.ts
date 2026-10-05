import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { PartnersService } from './partners.service';

@Controller('partners')
@UseGuards(JwtAuthGuard)
export class PartnersController {
  constructor(private partnersService: PartnersService) {}

  @Get()
  findAll(@Query('search') search?: string, @Query('archived') archived?: string) {
    return this.partnersService.findAll(search, archived === 'true');
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

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  archiveOrDelete(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.partnersService.archiveOrDelete(id, req.user.id);
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  restore(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.partnersService.restore(id, req.user.id);
  }
}
