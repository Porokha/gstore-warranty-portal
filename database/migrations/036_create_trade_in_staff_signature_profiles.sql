SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS trade_in_staff_signature_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(80) NOT NULL,
  signature MEDIUMBLOB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_trade_in_staff_signature_title (user_id, title),
  CONSTRAINT fk_trade_in_staff_signature_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO trade_in_staff_signature_profiles (user_id, title, signature, created_at, updated_at)
SELECT legacy.user_id, 'ძირითადი ხელმოწერა', legacy.signature, legacy.updated_at, legacy.updated_at
FROM trade_in_staff_signatures legacy
WHERE NOT EXISTS (
  SELECT 1 FROM trade_in_staff_signature_profiles profile WHERE profile.user_id = legacy.user_id
);

ALTER TABLE trade_in_staff_signing_links
  ADD COLUMN signature_profile_id INT NULL,
  ADD COLUMN signature_title VARCHAR(80) NULL,
  ADD CONSTRAINT fk_trade_in_staff_signing_profile FOREIGN KEY (signature_profile_id)
    REFERENCES trade_in_staff_signature_profiles(id) ON DELETE CASCADE;
