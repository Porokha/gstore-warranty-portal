import { Controller, Post, Body } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
  constructor(private publicService: PublicService) {}

  @Post('search/warranty')
  searchWarranty(@Body() body: { warranty_id: string; phone: string }) {
    return this.publicService.searchWarranty(body.warranty_id, body.phone);
  }

  @Post('search/case')
  searchCase(@Body() body: { case_number: string; phone: string }) {
    return this.publicService.searchCase(body.case_number, body.phone);
  }
}

