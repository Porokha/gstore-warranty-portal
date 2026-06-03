import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateShopProductDto } from './dto/create-shop-product.dto';
import { UpdateShopOrderDto } from './dto/update-shop-order.dto';
import { UpdateShopProductDto } from './dto/update-shop-product.dto';
import { ShopService } from './shop.service';

type MulterFile = any;

@Controller('shop/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('products')
  listProducts(
    @Query('scope') scope?: 'active' | 'trash',
    @Query('supplier') supplier?: 'manual' | 'mobilesentrix' | 'all',
  ) {
    const resolvedSupplier = ['manual', 'mobilesentrix', 'all'].includes(String(supplier))
      ? supplier
      : 'manual';
    return this.shopService.listAdminProducts(
      scope === 'trash' ? 'trash' : 'active',
      resolvedSupplier as 'manual' | 'mobilesentrix' | 'all',
    );
  }

  @Post('products/import/csv')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadsDir = path.join(process.cwd(), 'uploads', 'imports', 'shop-products');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          cb(null, uploadsDir);
        },
        filename: (req, file, cb) => {
          cb(null, `shop_products_${Date.now()}_${file.originalname}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only CSV files are allowed.'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  importProducts(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new BadRequestException('No CSV file uploaded.');
    }

    return this.shopService.importProductsFromCsv(file.path);
  }

  @Get('products/import/csv/template')
  downloadProductsTemplate(@Res() res: Response) {
    const csv = this.shopService.generateProductsTemplateCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=shop-products-template.csv');
    res.send(csv);
  }

  @Post('products/upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadsDir = path.join(process.cwd(), 'uploads', 'shop', 'products', '_incoming');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          cb(null, uploadsDir);
        },
        filename: (req, file, cb) => {
          cb(null, `${Date.now()}_${file.originalname.replace(/\s+/g, '-')}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (String(file.mimetype || '').startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only image files are allowed.'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  uploadProductImage(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new BadRequestException('No image file uploaded.');
    }

    return this.shopService.registerUploadedProductImage(file.path, file.originalname);
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

  @Patch('products/:id/restore')
  restoreProduct(@Param('id', ParseIntPipe) id: number) {
    return this.shopService.restoreProduct(id);
  }

  @Delete('products/:id/permanent')
  permanentlyDeleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.shopService.permanentlyDeleteProduct(id);
  }

  @Delete('products/:id')
  softDeleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.shopService.softDeleteProduct(id);
  }

  @Get('orders')
  listOrders(@Query('scope') scope?: 'active' | 'trash') {
    return this.shopService.listOrders(scope === 'trash' ? 'trash' : 'active');
  }

  @Patch('orders/:id')
  updateOrder(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateShopOrderDto) {
    return this.shopService.updateOrder(id, updateDto);
  }

  @Patch('orders/:id/restore')
  restoreOrder(@Param('id', ParseIntPipe) id: number) {
    return this.shopService.restoreOrder(id);
  }

  @Delete('orders/:id/permanent')
  permanentlyDeleteOrder(@Param('id', ParseIntPipe) id: number) {
    return this.shopService.permanentlyDeleteOrder(id);
  }

  @Delete('orders/:id')
  softDeleteOrder(@Param('id', ParseIntPipe) id: number) {
    return this.shopService.softDeleteOrder(id);
  }
}
