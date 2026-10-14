CREATE TABLE IF NOT EXISTS trade_in_agreements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  quote_id INT NOT NULL,
  details JSON NOT NULL,
  customer_signature MEDIUMBLOB NULL,
  representative_signature MEDIUMBLOB NULL,
  representative_user_id INT NULL,
  signing_token_hash CHAR(64) NULL,
  signing_token_expires_at DATETIME NULL,
  customer_signed_at DATETIME NULL,
  finalized_at DATETIME NULL,
  finalized_by_user_id INT NULL,
  pdf_data MEDIUMBLOB NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_trade_in_agreement_quote (quote_id),
  UNIQUE KEY uniq_trade_in_agreement_signing_token (signing_token_hash),
  CONSTRAINT fk_trade_in_agreement_quote FOREIGN KEY (quote_id) REFERENCES trade_in_quotes(id) ON DELETE RESTRICT,
  CONSTRAINT fk_trade_in_agreement_representative FOREIGN KEY (representative_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_trade_in_agreement_finalized_by FOREIGN KEY (finalized_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS trade_in_staff_signatures (
  user_id INT PRIMARY KEY,
  signature MEDIUMBLOB NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_trade_in_staff_signature_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
