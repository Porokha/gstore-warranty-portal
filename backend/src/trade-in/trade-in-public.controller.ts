import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateTradeInQuoteDto } from './dto/create-trade-in-quote.dto';
import { TradeInService } from './trade-in.service';

@Controller('trade-in')
export class TradeInPublicController {
  constructor(private readonly tradeInService: TradeInService) {}

  @Get('categories')
  listCategories() {
    return this.tradeInService.listPublicCategories();
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
