import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { UpdateTradeInCategoryDto } from './dto/update-trade-in-category.dto';
import { UpdateTradeInProductDto } from './dto/update-trade-in-product.dto';
import { UpdateTradeInQuoteDto } from './dto/update-trade-in-quote.dto';
import { TradeInQuoteStatus } from './entities/trade-in-quote.entity';
import { TradeInService } from './trade-in.service';

@Controller('shop/admin/trade-in')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class TradeInAdminController {
  constructor(private readonly tradeInService: TradeInService) {}

  @Get('categories')
  listCategories() {
    return this.tradeInService.listAdminCategories();
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTradeInCategoryDto,
  ) {
    return this.tradeInService.updateCategory(id, dto);
  }

  @Get('products')
  listProducts(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('enabled') enabled?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tradeInService.listAdminProducts({
      q,
      category,
      enabled,
      page: Number(page || 1),
      limit: Number(limit || 50),
    });
  }

  @Patch('products/:id')
  updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTradeInProductDto,
  ) {
    return this.tradeInService.updateProduct(id, dto);
  }

  @Get('quotes')
  listQuotes(
    @Query('status') status?: TradeInQuoteStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tradeInService.listQuotes(
      status,
      Number(page || 1),
      Number(limit || 50),
    );
  }

  @Get('quotes/counts')
  quoteCounts() {
    return this.tradeInService.getQuoteCounts();
  }

  @Patch('quotes/:id')
  updateQuote(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTradeInQuoteDto,
  ) {
    return this.tradeInService.updateQuote(id, dto);
  }

  @Delete('quotes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteQuote(@Param('id', ParseIntPipe) id: number) {
    return this.tradeInService.deleteQuote(id);
  }
}
