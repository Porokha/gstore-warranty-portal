import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject } from 'class-validator';
import { Language } from '../entities/sms-template.entity';

export class SendSmsDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  template_key: string;

  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;
}

