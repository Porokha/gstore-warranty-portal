import { IsString, IsNotEmpty } from 'class-validator';

export class SearchWarrantyDto {
  @IsString()
  @IsNotEmpty()
  warranty_id: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}

