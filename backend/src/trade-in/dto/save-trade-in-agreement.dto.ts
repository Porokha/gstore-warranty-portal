import { IsBoolean, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class SaveTradeInAgreementDto {
  @IsObject()
  details: Record<string, unknown>;
}

export class SubmitTradeInSignatureDto {
  @IsString()
  @MaxLength(500000)
  signature: string;
}

export class SetRepresentativeSignatureDto {
  @IsOptional()
  @IsBoolean()
  use_saved?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500000)
  signature?: string;
}
