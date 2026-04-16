import { PartialType } from '@nestjs/swagger';
import { CreateShopProductDto } from './create-shop-product.dto';

export class UpdateShopProductDto extends PartialType(CreateShopProductDto) {}
