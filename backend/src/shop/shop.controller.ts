import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateShopProductDto } from './dto/create-shop-product.dto';
import { UpdateShopOrderDto } from './dto/update-shop-order.dto';
import { UpdateShopProductDto } from './dto/update-shop-product.dto';
import { ShopService } from './shop.service';

@Controller('shop/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('products')
  listProducts() {
    return this.shopService.listAdminProducts();
  }

  @Post('products')
  createProduct(@Body() createDto: CreateShopProductDto) {
    return this.shopService.createProduct(createDto);
  }

  @Put('products/:id')
  updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateShopProductDto,
  ) {
    return this.shopService.updateProduct(id, updateDto);
  }

  @Get('orders')
  listOrders() {
    return this.shopService.listOrders();
  }

  @Patch('orders/:id')
  updateOrder(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateShopOrderDto) {
    return this.shopService.updateOrder(id, updateDto);
  }
}
