import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Put, Query, Request, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { UpdateTradeInCategoryDto } from './dto/update-trade-in-category.dto';
import { ReorderTradeInCategoriesDto } from './dto/reorder-trade-in-categories.dto';
import { UpdateTradeInBrandDto } from './dto/update-trade-in-brand.dto';
import { UpdateTradeInPricingDto } from './dto/update-trade-in-pricing.dto';
import { ExportSelectedTradeInPricingDto, ImportTradeInPricingDto, ReplaceTradeInPricingDto } from './dto/import-trade-in-pricing.dto';
import { UpdateTradeInProductDto } from './dto/update-trade-in-product.dto';
import { UpdateTradeInQuoteDto } from './dto/update-trade-in-quote.dto';
import { UpdateTradeInOfferPolicyDto } from './dto/update-trade-in-offer-policy.dto';
import { GstoreOfferProductDto } from './dto/gstore-offer-product.dto';
import { TradeInQuoteStatus } from './entities/trade-in-quote.entity';
import { TradeInService } from './trade-in.service';
import { TradeInAgreementService } from './trade-in-agreement.service';
import { SaveTradeInAgreementDto, SetRepresentativeSignatureDto, SubmitTradeInSignatureDto } from './dto/save-trade-in-agreement.dto';
import { SaveStaffSignatureProfileDto, StartStaffSignatureProfileSigningDto } from './dto/staff-signature-profile.dto';
import { TradeInVoucherService } from './trade-in-voucher.service';

@Controller('shop/admin/trade-in')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class TradeInAdminController {
  constructor(private readonly tradeInService: TradeInService, private readonly agreements: TradeInAgreementService, private readonly vouchers: TradeInVoucherService) {}

  @Get('quotes/:id/voucher')
  voucher(@Param('id', ParseIntPipe) id: number) {
    return this.vouchers.adminView(id);
  }

  @Post('quotes/:id/voucher/resend')
  resendVoucher(@Param('id', ParseIntPipe) id: number) {
    return this.vouchers.send(id, true);
  }

  @Post('quotes/:id/voucher/redeem')
  redeemVoucher(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.vouchers.redeem(id, req.user.id);
  }

  @Get('signature')
  getOwnSignature(@Request() req) {
    return this.agreements.getStaffSignature(req.user.id);
  }

  @Put('signature')
  saveOwnSignature(@Request() req, @Body() dto: SubmitTradeInSignatureDto) {
    return this.agreements.saveStaffSignature(req.user.id, dto.signature);
  }

  @Post('signature/profiles')
  createOwnSignature(@Request() req, @Body() dto: SaveStaffSignatureProfileDto) {
    return this.agreements.createStaffSignatureProfile(req.user.id, dto.title, dto.signature);
  }

  @Patch('signature/profiles/:id')
  updateOwnSignature(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() dto: SaveStaffSignatureProfileDto) {
    return this.agreements.updateStaffSignatureProfile(req.user.id, id, dto.title, dto.signature);
  }

  @Delete('signature/profiles/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteOwnSignature(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.agreements.deleteStaffSignatureProfile(req.user.id, id);
  }

  @Post('signature/signing-link')
  startOwnSignatureSigning(@Request() req, @Body() dto: StartStaffSignatureProfileSigningDto) {
    return this.agreements.startStaffSigning(req.user.id, undefined, dto);
  }

  @Get('signature/signing-link/:id/status')
  ownSignatureSigningStatus(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.agreements.staffSigningStatus(id, req.user.id);
  }

  @Post('quotes/:id/agreement')
  getAgreement(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.agreements.getOrCreate(id, req.user.id);
  }

  @Put('quotes/:id/agreement')
  saveAgreement(@Param('id', ParseIntPipe) id: number, @Request() req, @Body() dto: SaveTradeInAgreementDto) {
    return this.agreements.saveDraft(id, req.user.id, dto.details);
  }

  @Post('quotes/:id/agreement/signing-link')
  startSigning(@Param('id', ParseIntPipe) id: number) {
    return this.agreements.startSigning(id);
  }

  @Post('quotes/:id/agreement/representative-signing-link')
  startRepresentativeSigning(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.agreements.startStaffSigning(req.user.id, id);
  }

  @Put('quotes/:id/agreement/representative-signature')
  representativeSignature(@Param('id', ParseIntPipe) id: number, @Request() req, @Body() dto: SetRepresentativeSignatureDto) {
    return this.agreements.setRepresentativeSignature(id, req.user.id, dto);
  }

  @Post('quotes/:id/agreement/finalize')
  finalizeAgreement(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.agreements.finalize(id, req.user.id);
  }

  @Get('quotes/:id/agreement/pdf')
  async agreementPdf(@Param('id', ParseIntPipe) id: number, @Res() response: Response) {
    const file = await this.agreements.getPdf(id);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    response.setHeader('Cache-Control', 'private, no-store');
    response.send(file.bytes);
  }

  @Get('quotes/:id/agreement/preview')
  async agreementPreview(@Param('id', ParseIntPipe) id: number, @Res() response: Response) {
    const file = await this.agreements.getPreviewPdf(id);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    response.setHeader('Cache-Control', 'private, no-store');
    response.send(file.bytes);
  }

  @Get('offer-policy')
  getOfferPolicy() {
    return this.tradeInService.getOfferPolicy();
  }

  @Patch('offer-policy')
  updateOfferPolicy(@Body() dto: UpdateTradeInOfferPolicyDto) {
    return this.tradeInService.updateOfferPolicy(dto);
  }

  @Get('gstore-products')
  listGstoreProducts() {
    return this.tradeInService.listGstoreProducts(true);
  }

  @Post('gstore-products')
  createGstoreProduct(@Body() dto: GstoreOfferProductDto) {
    return this.tradeInService.saveGstoreProduct(dto);
  }

  @Patch('gstore-products/:id')
  updateGstoreProduct(@Param('id') id: string, @Body() dto: GstoreOfferProductDto) {
    return this.tradeInService.saveGstoreProduct(dto, id);
  }

  @Delete('gstore-products/:id')
  deleteGstoreProduct(@Param('id') id: string) {
    return this.tradeInService.deleteGstoreProduct(id);
  }

  @Get('categories')
  listCategories() {
    return this.tradeInService.listAdminCategories();
  }

  @Get('brands')
  listBrands() {
    return this.tradeInService.listAdminBrands();
  }

  @Patch('brands/availability')
  updateBrandAvailability(@Body() dto: UpdateTradeInBrandDto) {
    return this.tradeInService.updateBrandAvailability(dto);
  }

  @Patch('categories/order')
  reorderCategories(@Body() dto: ReorderTradeInCategoriesDto) {
    return this.tradeInService.reorderCategories(dto.category_ids);
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
    @Query('subcategory') subcategory?: string,
    @Query('enabled') enabled?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tradeInService.listAdminProducts({
      q,
      category,
      subcategory,
      enabled,
      page: Number(page || 1),
      limit: Number(limit || 50),
    });
  }

  @Get('products/subcategories')
  listProductSubcategories(@Query('category') category?: string) {
    return this.tradeInService.listAdminProductSubcategories(category);
  }

  @Get('pricing/export')
  exportPricingRules() {
    return this.tradeInService.exportPricingRules();
  }

  @Post('pricing/export-selected')
  exportSelectedPricingRules(@Body() dto: ExportSelectedTradeInPricingDto) {
    return this.tradeInService.exportPricingRules(dto.product_ids);
  }

  @Post('pricing/import')
  importPricingRules(@Body() dto: ImportTradeInPricingDto) {
    return this.tradeInService.importPricingRules(dto.products);
  }

  @Post('pricing/replace')
  replacePricingRules(@Body() dto: ReplaceTradeInPricingDto) {
    return this.tradeInService.replacePricingRules(dto.product_ids, dto.tree_json);
  }

  @Get('products/:id')
  getProduct(@Param('id', ParseIntPipe) id: number) {
    return this.tradeInService.getAdminProduct(id);
  }

  @Patch('products/:id')
  updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTradeInProductDto,
  ) {
    return this.tradeInService.updateProduct(id, dto);
  }

  @Patch('products/:id/pricing')
  updateProductPricing(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTradeInPricingDto,
  ) {
    return this.tradeInService.updateProductPricing(id, dto.tree_json);
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

  @Patch('quotes/:id/viewed')
  markQuoteViewed(@Param('id', ParseIntPipe) id: number) {
    return this.tradeInService.markQuoteViewed(id);
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
