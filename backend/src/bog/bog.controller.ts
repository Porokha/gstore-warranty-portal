import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BogService } from './bog.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { PaymentsService } from '../payments/payments.service';

@Controller('bog')
export class BogController {
  constructor(
    private bogService: BogService,
    private paymentsService: PaymentsService,
  ) {}

  @Post('payments/:paymentId/initiate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async initiatePayment(
    @Param('paymentId', ParseIntPipe) paymentId: number,
    @Body() initiateDto: InitiatePaymentDto,
  ) {
    // Get payment to extract customer info if not provided
    const payment = await this.paymentsService.findOne(paymentId);
    
    const customerInfo = {
      first_name: initiateDto.customer_first_name || payment.case_.customer_name,
      last_name: initiateDto.customer_last_name || payment.case_.customer_last_name || '',
      phone: initiateDto.customer_phone || payment.case_.customer_phone,
      email: initiateDto.customer_email || payment.case_.customer_email || undefined,
    };

    const amount = initiateDto.amount || payment.offer_amount || 0;
    const description = initiateDto.description || 
                       `Payment for case ${payment.case_.case_number} - ${payment.offer_type}`;

    return this.bogService.initiatePayment(
      paymentId,
      amount,
      description,
      customerInfo,
    );
  }

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  async handleCallback(@Body() callbackData: any) {
    // This endpoint is public and called by BOG
    // In production, add IP whitelist verification
    await this.bogService.handleCallback(callbackData);
    return { success: true };
  }

  @Get('payments/:paymentId/status')
  @UseGuards(JwtAuthGuard)
  async checkPaymentStatus(@Param('paymentId', ParseIntPipe) paymentId: number) {
    return this.bogService.checkPaymentStatus(paymentId);
  }
}

