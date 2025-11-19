import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PublicService } from './public.service';
import { SearchWarrantyDto } from './dto/search-warranty.dto';
import { SearchCaseDto } from './dto/search-case.dto';

@Controller('public')
export class PublicController {
  constructor(private publicService: PublicService) {}

  @Post('search/warranty')
  @HttpCode(HttpStatus.OK)
  searchWarranty(@Body() searchDto: SearchWarrantyDto) {
    return this.publicService.searchWarranty(searchDto);
  }

  @Post('search/case')
  @HttpCode(HttpStatus.OK)
  searchCase(@Body() searchDto: SearchCaseDto) {
    return this.publicService.searchCase(searchDto);
  }
}
