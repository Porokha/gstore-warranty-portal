import { IsString, Matches } from 'class-validator';

export class VerifyPickupDto {
  @IsString()
  @Matches(/^\d{6}$/)
  code: string;
}
