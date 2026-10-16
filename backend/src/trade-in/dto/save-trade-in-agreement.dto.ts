import { IsBoolean, IsInt, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator';

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
  @IsInt()
  @Min(1)
  signature_id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500000)
  signature?: string;
}
