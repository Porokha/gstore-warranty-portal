ALTER TABLE sms_settings
  ADD COLUMN template_warranty_created_key VARCHAR(191) NULL AFTER send_on_warranty_created,
  ADD COLUMN template_case_opened_key VARCHAR(191) NULL AFTER send_on_case_opened,
  ADD COLUMN template_status_change_key VARCHAR(191) NULL AFTER send_on_status_change,
  ADD COLUMN template_offer_created_key VARCHAR(191) NULL AFTER send_on_offer_created,
  ADD COLUMN template_payment_confirmed_key VARCHAR(191) NULL AFTER send_on_payment_confirmed,
  ADD COLUMN template_case_completed_key VARCHAR(191) NULL AFTER send_on_case_completed,
  ADD COLUMN template_sla_due_key VARCHAR(191) NULL AFTER send_on_sla_due,
  ADD COLUMN template_sla_stalled_key VARCHAR(191) NULL AFTER send_on_sla_stalled,
  ADD COLUMN template_sla_deadline_1day_key VARCHAR(191) NULL AFTER send_on_sla_deadline_1day;

UPDATE sms_settings
SET
  template_warranty_created_key = COALESCE(template_warranty_created_key, 'sms.warranty.created'),
  template_case_opened_key = COALESCE(template_case_opened_key, 'sms.case.opened'),
  template_status_change_key = COALESCE(template_status_change_key, 'sms.case.status_change'),
  template_offer_created_key = COALESCE(template_offer_created_key, 'sms.offer.created'),
  template_payment_confirmed_key = COALESCE(template_payment_confirmed_key, 'sms.payment.confirmed'),
  template_case_completed_key = COALESCE(template_case_completed_key, 'sms.case.completed'),
  template_sla_due_key = COALESCE(template_sla_due_key, 'sms.sla_due'),
  template_sla_stalled_key = COALESCE(template_sla_stalled_key, 'sms.sla_stalled'),
  template_sla_deadline_1day_key = COALESCE(template_sla_deadline_1day_key, 'sms.sla_deadline_1day');
