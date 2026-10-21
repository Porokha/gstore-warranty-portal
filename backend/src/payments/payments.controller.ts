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
import { PaymentsService } from './payments.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { PickupService } from '../cases/pickup.service';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService, private pickupService: PickupService) {}

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
  findAll(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('device_type') deviceType?: string,
    @Query('payment_status') paymentStatus?: string,
    @Query('payment_method') paymentMethod?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('include_history') includeHistory?: string,
  ) {
    const filters: any = {};
    const parseDate = (value: string, endOfDay: boolean) => {
      const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}+04:00`)
        : new Date(value);
      if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid payment date filter');
      return date;
    };
    
    if (startDate) {
      filters.start_date = parseDate(startDate, false);
    }
    
    if (endDate) {
      filters.end_date = parseDate(endDate, true);
    }
    
    if (deviceType) {
      filters.device_type = deviceType;
    }
    
    if (paymentStatus) {
      filters.payment_status = paymentStatus;
    }
    
    if (paymentMethod) {
      filters.payment_method = paymentMethod;
    }

    const pageNumber = page === undefined ? 1 : Number(page);
    const pageLimit = limit === undefined ? 50 : Number(limit);
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || !Number.isInteger(pageLimit) || pageLimit < 1 || pageLimit > 200) {
      throw new BadRequestException('Invalid payment pagination');
    }
    return this.paymentsService.findAll(filters, pageNumber, pageLimit, includeHistory === 'true');
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
