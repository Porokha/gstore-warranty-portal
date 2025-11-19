import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsBoolean()
  global_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  send_on_warranty_created?: boolean;

  @IsOptional()
  @IsBoolean()
  send_on_case_opened?: boolean;

  @IsOptional()
  @IsBoolean()
  send_on_status_change?: boolean;

  @IsOptional()
  @IsBoolean()
  send_on_offer_created?: boolean;

  @IsOptional()
  @IsBoolean()
  send_on_payment_confirmed?: boolean;

  @IsOptional()
  @IsBoolean()
  send_on_case_completed?: boolean;

  @IsOptional()
  @IsBoolean()
  send_on_sla_due?: boolean;

  @IsOptional()
  @IsBoolean()
  send_on_sla_stalled?: boolean;

  @IsOptional()
  @IsBoolean()
  send_on_sla_deadline_1day?: boolean;
}

