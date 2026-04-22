import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ShopOrderPaymentChoice {
  ONLINE = 'online',
  ONSITE = 'onsite',
}

export enum ShopOrderHeardAbout {
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  TIKTOK = 'tiktok',
  FRIEND = 'friend',
  GOOGLE = 'google',
  AI = 'ai',
}

export enum ShopOrderItemMode {
  PRODUCT = 'product',
  SERVICE = 'service',
}

export class CreatePublicShopOrderItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  product_id: number;

  @IsEnum(ShopOrderItemMode)
  mode: ShopOrderItemMode;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreatePublicShopOrderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  customer_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  customer_last_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  customer_phone: string;

  @IsEmail()
  @MaxLength(180)
  customer_email: string;

  @IsEnum(ShopOrderHeardAbout)
  heard_about: ShopOrderHeardAbout;

  @Type(() => Boolean)
  @IsBoolean()
  has_partner_warranty: boolean;

  @ValidateIf((dto: CreatePublicShopOrderDto) => dto.has_partner_warranty)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  partner_warranty_id?: string;

  @IsEnum(ShopOrderPaymentChoice)
  payment_method: ShopOrderPaymentChoice;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePublicShopOrderItemDto)
  items: CreatePublicShopOrderItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  customer_note?: string;
}
