import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { Language } from '../entities/sms-template.entity';

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsEnum(Language)
  language: Language;

  @IsString()
  @IsNotEmpty()
  template_text: string;
}

