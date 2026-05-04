import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsBoolean()
  global_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  send_on_warranty_created?: boolean;

  @IsOptional()
  @IsString()
  template_warranty_created_key?: string;

  @IsOptional()
  @IsBoolean()
  send_on_case_opened?: boolean;

  @IsOptional()
  @IsString()
  template_case_opened_key?: string;

  @IsOptional()
  @IsBoolean()
  send_on_status_change?: boolean;

  @IsOptional()
  @IsString()
  template_status_change_key?: string;

  @IsOptional()
  @IsBoolean()
  send_on_offer_created?: boolean;

  @IsOptional()
  @IsString()
  template_offer_created_key?: string;

  @IsOptional()
  @IsBoolean()
  send_on_payment_confirmed?: boolean;

  @IsOptional()
  @IsString()
  template_payment_confirmed_key?: string;

  @IsOptional()
  @IsBoolean()
  send_on_case_completed?: boolean;

  @IsOptional()
  @IsString()
  template_case_completed_key?: string;

  @IsOptional()
  @IsBoolean()
  send_on_sla_due?: boolean;

  @IsOptional()
  @IsString()
  template_sla_due_key?: string;

  @IsOptional()
  @IsBoolean()
  send_on_sla_stalled?: boolean;

  @IsOptional()
  @IsString()
  template_sla_stalled_key?: string;

  @IsOptional()
  @IsBoolean()
  send_on_sla_deadline_1day?: boolean;

  @IsOptional()
  @IsString()
  template_sla_deadline_1day_key?: string;
}
