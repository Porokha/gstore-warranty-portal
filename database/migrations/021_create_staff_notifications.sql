CREATE TABLE IF NOT EXISTS staff_notifications (
  id INT NOT NULL AUTO_INCREMENT,
  recipient_user_id INT NOT NULL,
  case_id INT NULL,
  case_number VARCHAR(64) NULL,
  type VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NULL,
  read_at DATETIME NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  INDEX idx_staff_notifications_recipient_read (recipient_user_id, read_at),
  INDEX idx_staff_notifications_case (case_id),
  CONSTRAINT fk_staff_notifications_recipient
    FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_staff_notifications_case
    FOREIGN KEY (case_id) REFERENCES service_cases(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
