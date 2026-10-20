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
  Header,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { isTechnicianRole, UserRole } from '../users/entities/user.entity';
import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { AddInternalNoteDto } from './dto/add-internal-note.dto';
import { CaseStatusLevel, CaseType, ResultType, Priority } from './entities/service-case.entity';
import { PickupService } from './pickup.service';
import { VerifyPickupDto } from './dto/verify-pickup.dto';

@Controller('cases')
@UseGuards(JwtAuthGuard)
export class CasesController {
  constructor(private casesService: CasesService, private pickupService: PickupService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('result') result?: ResultType,
    @Query('priority') priority?: Priority,
    @Query('case_type') case_type?: CaseType,
    @Query('device_type') device_type?: string,
    @Query('technician_id') technician_id?: string,
    @Query('tags') tags?: string,
    @Query('search') search?: string,
    @Query('customer') customer?: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
    @Query('closeToDeadline') closeToDeadline?: string,
    @Query('due') due?: string,
    @Query('case_scope') caseScope?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Request() req?,
  ) {
    const filters: any = {};
    
    // Parse status - validate it's a valid number
    if (status !== undefined && status !== null && status !== '') {
      if (status.includes(',')) {
        const statuses = status.split(',').map(s => parseInt(s.trim(), 10)).filter(s => !isNaN(s) && s >= 1 && s <= 4);
        if (statuses.length > 0) {
          filters.status = statuses;
        }
      } else {
        const statusNum = Number(status);
        if (Number.isInteger(statusNum) && statusNum >= 1 && statusNum <= 4) {
          filters.status = statusNum as CaseStatusLevel;
        }
      }
    }
    
    if (result) filters.result = result;
    if (priority) filters.priority = priority;
    if (case_type && Object.values(CaseType).includes(case_type)) filters.case_type = case_type;
    if (caseScope === 'standard') filters.case_type = CaseType.STANDARD;
    if (caseScope === 'partner') filters.case_type = CaseType.PARTNER;
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
    if (customer) filters.customer = customer;
    if (start_date) filters.start_date = new Date(start_date);
    if (end_date) filters.end_date = new Date(end_date);
    if (closeToDeadline === 'true') filters.closeToDeadline = true;
    if (due === 'true') filters.due = true;
    if (isTechnicianRole(req?.user?.role)) {
      filters.excludePendingFromDeadline = true;
    }

    if (page !== undefined) {
      const pageNumber = Number(page);
      const pageLimit = limit === undefined ? 25 : Number(limit);
      if (!Number.isInteger(pageNumber) || pageNumber < 1 || !Number.isInteger(pageLimit) || pageLimit < 1 || pageLimit > 500) {
        throw new BadRequestException('Invalid case pagination');
      }
      return this.casesService.findPage(filters, pageNumber, pageLimit);
    }
    return this.casesService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.casesService.findOne(id);
  }

  @Post()
  create(@Body() createDto: CreateCaseDto, @Request() req) {
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
  @Header('Cache-Control', 'no-store')
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() changeStatusDto: ChangeStatusDto,
    @Request() req,
  ) {
    return this.casesService.changeStatus(id, changeStatusDto, req.user.id);
  }

  @Post(':id/parts-waiting/start')
  startPartsWaiting(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.casesService.startPartsWaiting(id, req.user.id);
  }

  @Post(':id/parts-waiting/received')
  receivePartsWaiting(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.casesService.receivePartsWaiting(id, req.user.id);
  }

  @Post(':id/internal-notes')
  addInternalNote(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddInternalNoteDto,
    @Request() req,
  ) {
    return this.casesService.addInternalNote(id, dto.note, req.user.id);
  }

  @Delete(':id/internal-notes/:historyId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteInternalNote(
    @Param('id', ParseIntPipe) id: number,
    @Param('historyId', ParseIntPipe) historyId: number,
    @Request() req,
  ) {
    return this.casesService.deleteInternalNote(id, historyId, req.user.id);
  }

  @Post(':id/reopen')
  reopen(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.casesService.reopen(id, req.user.id);
  }

  @Get(':id/pickup')
  pickupStatus(@Param('id', ParseIntPipe) id: number) {
    return this.pickupService.status(id);
  }

  @Post(':id/pickup/issue')
  @Header('Cache-Control', 'no-store')
  issuePickupPin(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.pickupService.issue(id, req.user.id);
  }

  @Post(':id/pickup/verify')
  @Header('Cache-Control', 'no-store')
  verifyPickupPin(@Param('id', ParseIntPipe) id: number, @Body() dto: VerifyPickupDto, @Request() req) {
    return this.pickupService.verify(id, dto.code, req.user.id);
  }

  @Post(':id/pickup/collect')
  @Header('Cache-Control', 'no-store')
  collectWithoutPin(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.pickupService.collectWithoutPin(id, req.user.id);
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
