import { ArrayMinSize, IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { Language } from '../entities/sms-template.entity';

export class SendBulkSmsTestDto {
  @IsOptional()
  @IsString()
  template_key?: string;

  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @IsOptional()
  @IsString()
  message_text?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  phones: string[];
}
