import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WarrantiesService } from './warranties.service';

@Controller('warranties')
@UseGuards(JwtAuthGuard)
export class WarrantiesController {
  constructor(private warrantiesService: WarrantiesService) {}

  @Get()
  findAll() {
    return this.warrantiesService.findAll();
  }
}

