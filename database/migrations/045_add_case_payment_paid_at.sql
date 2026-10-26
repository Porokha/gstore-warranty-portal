ALTER TABLE case_payments
  ADD COLUMN paid_at DATETIME NULL AFTER payment_status,
  ADD INDEX idx_case_payments_paid_at (paid_at);
