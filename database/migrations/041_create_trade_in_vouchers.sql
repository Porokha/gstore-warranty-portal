CREATE TABLE IF NOT EXISTS trade_in_vouchers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  quote_id INT NOT NULL,
  code CHAR(8) NOT NULL,
  public_token CHAR(43) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  expires_at DATETIME NOT NULL,
  redeemed_at DATETIME NULL,
  redeemed_by_user_id INT NULL,
  sms_status VARCHAR(16) NOT NULL DEFAULT 'pending',
  sms_attempt_count INT NOT NULL DEFAULT 0,
  sms_last_attempt_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_trade_in_voucher_quote (quote_id),
  UNIQUE KEY uniq_trade_in_voucher_code (code),
  UNIQUE KEY uniq_trade_in_voucher_token (public_token),
  CONSTRAINT fk_trade_in_voucher_quote FOREIGN KEY (quote_id) REFERENCES trade_in_quotes(id) ON DELETE RESTRICT,
  CONSTRAINT fk_trade_in_voucher_redeemed_by FOREIGN KEY (redeemed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO sms_templates (`key`, language, template_text)
SELECT 'sms.trade_in.voucher', 'ka', 'თქვენი ZEZVA Trade-in ვაუჩერი: {voucher_code}. ღირებულება: {amount} ₾. მოქმედებს {expires_at}-მდე. ვაუჩერი: {voucher_url}'
WHERE NOT EXISTS (SELECT 1 FROM sms_templates WHERE `key` = 'sms.trade_in.voucher' AND language = 'ka');
