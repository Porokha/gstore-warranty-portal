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
  Request,
  Header,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { FinanceFilters, PaymentsService } from './payments.service';
import { PaymentStatus } from './entities/case-payment.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { PickupService } from '../cases/pickup.service';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService, private pickupService: PickupService) {}

  private parseFinanceFilters(query: Record<string, string | undefined>): FinanceFilters {
    const parseDate = (value: string, endOfDay: boolean) => {
      const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}+04:00`)
        : new Date(value);
      if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid payment date filter');
      return date;
    };
    if (query.date_basis && !['created', 'paid'].includes(query.date_basis)) {
      throw new BadRequestException('Invalid payment date basis');
    }
    if (query.payment_status && !Object.values(PaymentStatus).includes(query.payment_status as PaymentStatus)) {
      throw new BadRequestException('Invalid payment status');
    }
    if (query.payment_method && !['onsite', 'online'].includes(query.payment_method)) {
      throw new BadRequestException('Invalid payment method');
    }
    const filters: FinanceFilters = {
      date_basis: (query.date_basis as FinanceFilters['date_basis']) || 'created',
      device_type: query.device_type || undefined,
      payment_status: query.payment_status as PaymentStatus || undefined,
      payment_method: query.payment_method || undefined,
    };
    if (query.start_date) filters.start_date = parseDate(query.start_date, false);
    if (query.end_date) filters.end_date = parseDate(query.end_date, true);
    if (filters.start_date && filters.end_date && filters.start_date > filters.end_date) {
      throw new BadRequestException('Start date must not be after end date');
    }
    return filters;
  }

  // Protected routes (staff only)
  @Post('cases/:caseId/offers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECH_MANAGER, UserRole.SUPER_TECHNICIAN)
  createOffer(
    @Param('caseId', ParseIntPipe) caseId: number,
    @Body() createOfferDto: CreateOfferDto,
  ) {
    return this.paymentsService.createOffer(caseId, createOfferDto);
  }

  @Get('cases/:caseId')
  @UseGuards(JwtAuthGuard)
  findAllByCase(@Param('caseId', ParseIntPipe) caseId: number) {
    return this.paymentsService.findAllByCase(caseId);
  }

  @Get('reports/finance/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_TECHNICIAN)
  @Header('Cache-Control', 'no-store')
  getFinanceSummary(@Query() query: Record<string, string>) {
    return this.paymentsService.getFinanceSummary(this.parseFinanceFilters(query));
  }

  @Get('reports/finance.csv')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_TECHNICIAN)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="zezva-finance.csv"')
  @Header('Cache-Control', 'no-store')
  exportFinance(@Query() query: Record<string, string>) {
    return this.paymentsService.exportFinanceCsv(this.parseFinanceFilters(query));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECH_MANAGER, UserRole.SUPER_TECHNICIAN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePaymentDto,
  ) {
    return this.paymentsService.update(id, updateDto);
  }

  @Post(':id/generate-code')
  @Header('Cache-Control', 'no-store')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async generateCode(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    const payment = await this.paymentsService.findOne(id);
    const issued = await this.pickupService.issue(payment.case_id, req.user.id);
    return { generated_code: issued.code, expires_at: issued.expires_at };
  }

  @Post(':id/mark-paid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECH_MANAGER, UserRole.SUPER_TECHNICIAN)
  @HttpCode(HttpStatus.OK)
  markAsPaid(
    @Param('id', ParseIntPipe) id: number,
    @Body('bog_transaction_id') bogTransactionId?: string,
  ) {
    return this.paymentsService.markAsPaid(id, bogTransactionId);
  }

  @Post(':id/mark-failed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECH_MANAGER, UserRole.SUPER_TECHNICIAN)
  @HttpCode(HttpStatus.OK)
  markAsFailed(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.markAsFailed(id);
  }

  @Post(':id/retry')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECH_MANAGER, UserRole.SUPER_TECHNICIAN)
  @HttpCode(HttpStatus.OK)
  retryFailed(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.retryFailed(id);
  }

  @Post(':id/send-payment-reminder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECH_MANAGER, UserRole.SUPER_TECHNICIAN)
  @HttpCode(HttpStatus.OK)
  sendPaymentReminder(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.sendPaymentReminder(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECH_MANAGER, UserRole.SUPER_TECHNICIAN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.remove(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_TECHNICIAN)
  @Header('Cache-Control', 'no-store')
  findAll(@Query() query: Record<string, string>) {
    const filters = this.parseFinanceFilters(query);
    const pageNumber = query.page === undefined ? 1 : Number(query.page);
    const pageLimit = query.limit === undefined ? 50 : Number(query.limit);
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || !Number.isInteger(pageLimit) || pageLimit < 1 || pageLimit > 200) {
      throw new BadRequestException('Invalid payment pagination');
    }
    return this.paymentsService.findAll(filters, pageNumber, pageLimit, query.include_history === 'true');
  }

  @Get('stats/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_TECHNICIAN)
  getStats(@Query('case_id') caseId?: number) {
    return this.paymentsService.getStats(caseId ? parseInt(caseId.toString()) : undefined);
  }

  // Legacy route retained for staff pickup verification; it never settles payments.
  @Post('verify-code')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  verifyCode(@Body() verifyCodeDto: VerifyCodeDto, @Request() req) {
    return this.pickupService.verify(verifyCodeDto.case_id, verifyCodeDto.code, req.user.id);
  }
}
