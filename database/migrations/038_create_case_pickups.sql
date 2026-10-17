CREATE TABLE IF NOT EXISTS case_pickups (
  case_id INT NOT NULL PRIMARY KEY,
  pin_hash VARCHAR(64) NULL,
  issued_at DATETIME NULL,
  expires_at DATETIME NULL,
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until DATETIME NULL,
  collected_at DATETIME NULL,
  collected_by_user_id INT NULL,
  CONSTRAINT fk_case_pickups_case FOREIGN KEY (case_id) REFERENCES service_cases(id) ON DELETE CASCADE
);
