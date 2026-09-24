import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsInt, Min } from 'class-validator';

export class ExportSelectedTradeInPricingDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(2000)
  @IsInt({ each: true })
  @Min(1, { each: true })
  product_ids: number[];
}

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
