import { IsOptional, IsString, MinLength } from 'class-validator';

export class ChangeOwnPasswordDto {
  @IsOptional()
  @IsString()
  current_password?: string;

  @IsString()
  @MinLength(6)
  new_password: string;
}
