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
import { PaymentsService } from './payments.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { GenerateCodeDto } from './dto/generate-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  // Protected routes (staff only)
  @Post('cases/:caseId/offers')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePaymentDto,
  ) {
    return this.paymentsService.update(id, updateDto);
  }

  @Post(':id/generate-code')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  generateCode(
    @Param('id', ParseIntPipe) id: number,
    @Body() generateCodeDto: GenerateCodeDto,
  ) {
    return this.paymentsService.generatePaymentCode(id, generateCodeDto);
  }

  @Post(':id/mark-paid')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  markAsPaid(
    @Param('id', ParseIntPipe) id: number,
    @Body('bog_transaction_id') bogTransactionId?: string,
  ) {
    return this.paymentsService.markAsPaid(id, bogTransactionId);
  }

  @Post(':id/mark-failed')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  markAsFailed(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.markAsFailed(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.remove(id);
  }

  @Get('stats/summary')
  @UseGuards(JwtAuthGuard)
  getStats(@Query('case_id') caseId?: number) {
    return this.paymentsService.getStats(caseId ? parseInt(caseId.toString()) : undefined);
  }

  // Public route (for code verification)
  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  verifyCode(@Body() verifyCodeDto: VerifyCodeDto) {
    return this.paymentsService.verifyCode(verifyCodeDto);
  }
}
