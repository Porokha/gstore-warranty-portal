ALTER TABLE case_payments
  MODIFY COLUMN payment_status ENUM('pending', 'paid', 'failed', 'cancelled') DEFAULT 'pending';

UPDATE case_payments AS payment
JOIN service_cases AS service_case ON service_case.id = payment.case_id
SET payment.payment_status = 'cancelled'
WHERE payment.payment_status IN ('pending', 'failed')
  AND (service_case.result_type IS NULL OR service_case.result_type <> payment.offer_type
    OR service_case.status_level < 3);
