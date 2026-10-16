CREATE TABLE IF NOT EXISTS trade_in_staff_signing_links (
  id INT PRIMARY KEY AUTO_INCREMENT,
  token_hash CHAR(64) NOT NULL,
  purpose VARCHAR(16) NOT NULL,
  user_id INT NOT NULL,
  quote_id INT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_trade_in_staff_signing_token (token_hash),
  KEY idx_trade_in_staff_signing_scope (user_id, purpose, quote_id),
  CONSTRAINT fk_trade_in_staff_signing_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_trade_in_staff_signing_quote FOREIGN KEY (quote_id) REFERENCES trade_in_quotes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
