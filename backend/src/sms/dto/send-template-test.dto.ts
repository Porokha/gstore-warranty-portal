import { IsArray, ArrayMinSize, IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { Language } from '../entities/sms-template.entity';

export class SendTemplateTestDto {
  @IsString()
  @IsNotEmpty()
  template_key: string;

  @IsEnum(Language)
  language: Language;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  phones: string[];
}
