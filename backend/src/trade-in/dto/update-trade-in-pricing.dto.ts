import { IsArray } from 'class-validator';

export class UpdateTradeInPricingDto {
  @IsArray()
  tree_json: any[];
}
