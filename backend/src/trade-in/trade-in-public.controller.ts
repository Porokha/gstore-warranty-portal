import { Body, Controller, Get, Header, Param, Post, Query } from '@nestjs/common';
import { CreateTradeInQuoteDto } from './dto/create-trade-in-quote.dto';
import { TradeInService } from './trade-in.service';
import { TradeInAgreementService } from './trade-in-agreement.service';
import { SubmitTradeInSignatureDto } from './dto/save-trade-in-agreement.dto';

@Controller('trade-in')
export class TradeInPublicController {
  constructor(private readonly tradeInService: TradeInService, private readonly agreements: TradeInAgreementService) {}

  @Get('sign/:token')
  @Header('Cache-Control', 'no-store')
  signingPreview(@Param('token') token: string) {
    return this.agreements.signingPreview(token);
  }

  @Post('sign/:token')
  @Header('Cache-Control', 'no-store')
  sign(@Param('token') token: string, @Body() dto: SubmitTradeInSignatureDto) {
    return this.agreements.submitCustomerSignature(token, dto.signature);
  }

  @Get('staff-sign/:token')
  @Header('Cache-Control', 'no-store')
  staffSigningPreview(@Param('token') token: string) {
    return this.agreements.staffSigningPreview(token);
  }

  @Post('staff-sign/:token')
  @Header('Cache-Control', 'no-store')
  staffSign(@Param('token') token: string, @Body() dto: SubmitTradeInSignatureDto) {
    return this.agreements.submitStaffSignature(token, dto.signature);
  }

  @Get('categories')
  listCategories() {
    return this.tradeInService.listPublicCategories();
  }

  @Get('offer-policy')
  getOfferPolicy() {
    return this.tradeInService.getOfferPolicy();
  }

  @Get('gstore-products')
  listGstoreProducts() {
    return this.tradeInService.listGstoreProducts();
  }

  @Get('brands')
  listBrands(@Query('category') category: string) {
    return this.tradeInService.listBrands(category);
  }

  @Get('series')
  listSeries(@Query('category') category: string, @Query('brand') brand: string) {
    return this.tradeInService.listSeries(category, brand);
  }

  @Get('products')
  listProducts(
    @Query('category') category?: string,
    @Query('brand') brand?: string,
    @Query('series') series?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tradeInService.listProducts({
      category,
      brand,
      series,
      q,
      page: Number(page || 1),
      limit: Number(limit || 30),
    });
  }

  @Get('product')
  getProduct(@Query('slug') slug: string) {
    return this.tradeInService.getProduct(slug);
  }

  @Post('quotes')
  createQuote(@Body() dto: CreateTradeInQuoteDto) {
    return this.tradeInService.createQuote(dto);
  }
}
