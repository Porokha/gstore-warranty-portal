import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { UserRole, LanguagePreference } from '../entities/user.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsEnum(LanguagePreference)
  language_preference?: LanguagePreference;

  @IsOptional()
  @IsBoolean()
  must_change_password?: boolean;

  @IsOptional()
  @IsBoolean()
  is_postponed?: boolean;
}
