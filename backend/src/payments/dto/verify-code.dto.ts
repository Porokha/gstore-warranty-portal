import { IsInt, IsString, Matches, Min } from 'class-validator';

export class VerifyCodeDto {
  @IsString()
  @Matches(/^\d{6}$/)
  code: string;

  @IsInt()
  @Min(1)
  case_id: number;
}

