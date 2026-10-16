ALTER TABLE shop_orders
  ADD COLUMN payment_status VARCHAR(24) NOT NULL DEFAULT 'unpaid',
  ADD COLUMN paid_at DATETIME NULL,
  ADD COLUMN checkout_request_id VARCHAR(36) NULL,
  ADD UNIQUE KEY uniq_shop_order_checkout_request (checkout_request_id);

CREATE TABLE shop_payment_attempts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  shop_order_id INT NOT NULL,
  provider VARCHAR(24) NOT NULL DEFAULT 'bog',
  provider_order_id VARCHAR(100) NULL,
  idempotency_key VARCHAR(36) NOT NULL,
  return_token_hash CHAR(64) NOT NULL,
  redirect_url TEXT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'created',
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'GEL',
  last_error VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_shop_payment_provider_order (provider_order_id),
  UNIQUE KEY uniq_shop_payment_idempotency (idempotency_key),
  KEY idx_shop_payment_order (shop_order_id, id),
  CONSTRAINT fk_shop_payment_order FOREIGN KEY (shop_order_id) REFERENCES shop_orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE shop_payment_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  attempt_id INT NOT NULL,
  shop_order_id INT NOT NULL,
  event_type VARCHAR(40) NOT NULL,
  status VARCHAR(32) NULL,
  detail VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_shop_payment_event_order (shop_order_id, id),
  CONSTRAINT fk_shop_payment_event_attempt FOREIGN KEY (attempt_id) REFERENCES shop_payment_attempts(id),
  CONSTRAINT fk_shop_payment_event_order FOREIGN KEY (shop_order_id) REFERENCES shop_orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
