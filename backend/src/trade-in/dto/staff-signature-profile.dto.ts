import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class SaveStaffSignatureProfileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500000)
  signature?: string;
}

export class StartStaffSignatureProfileSigningDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  title: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  profile_id?: number;
}
