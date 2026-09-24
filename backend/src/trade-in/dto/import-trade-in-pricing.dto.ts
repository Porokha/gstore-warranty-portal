import { ArrayMaxSize, IsArray } from 'class-validator';

export class ImportTradeInPricingDto {
  @IsArray()
  @ArrayMaxSize(10)
  products: Array<{ id: number; slug: string; tree_json: any[] }>;
}

export class ReplaceTradeInPricingDto {
  @IsArray()
  @ArrayMaxSize(100)
  product_ids: number[];

  @IsArray()
  tree_json: any[];
}
