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
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { CaseStatusLevel, ResultType, Priority } from './entities/service-case.entity';

@Controller('cases')
@UseGuards(JwtAuthGuard)
export class CasesController {
  constructor(private casesService: CasesService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('result') result?: ResultType,
    @Query('priority') priority?: Priority,
    @Query('device_type') device_type?: string,
    @Query('technician_id') technician_id?: string,
    @Query('tags') tags?: string,
    @Query('search') search?: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
  ) {
    const filters: any = {};
    
    // Parse status - validate it's a valid number
    if (status !== undefined && status !== null && status !== '') {
      const statusNum = parseInt(status, 10);
      if (!isNaN(statusNum) && statusNum >= 1 && statusNum <= 4) {
        filters.status = statusNum as CaseStatusLevel;
      }
    }
    
    if (result) filters.result = result;
    if (priority) filters.priority = priority;
    if (device_type) filters.device_type = device_type;
    
    // Parse technician_id - validate it's a valid number
    if (technician_id !== undefined && technician_id !== null && technician_id !== '') {
      const techId = parseInt(technician_id, 10);
      if (!isNaN(techId)) {
        filters.technician_id = techId;
      }
    }
    
    if (tags) filters.tags = tags.split(',');
    if (search) filters.search = search;
    if (start_date) filters.start_date = new Date(start_date);
    if (end_date) filters.end_date = new Date(end_date);

    return this.casesService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.casesService.findOne(id);
  }

  @Post()
  create(@Body() createDto: CreateCaseDto, @Request() req) {
    // Log received data for debugging
    console.log('Received case creation request:', JSON.stringify(createDto, null, 2));
    return this.casesService.create(createDto, req.user.id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCaseDto,
    @Request() req,
  ) {
    return this.casesService.update(id, updateDto, req.user.id);
  }

  @Post(':id/status')
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() changeStatusDto: ChangeStatusDto,
    @Request() req,
  ) {
    return this.casesService.changeStatus(id, changeStatusDto, req.user.id);
  }

  @Post(':id/reopen')
  reopen(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.casesService.reopen(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.casesService.remove(id, req.user.id);
  }
}
