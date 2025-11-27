-- 002_add_warranty_admin_fields.sql
-- Adds admin-only warranty columns (brand/model/condition/PIN/admin_notes)

SET @db := DATABASE();

SET @qry := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'warranties' AND COLUMN_NAME = 'brand') = 0,
  'ALTER TABLE `warranties` ADD COLUMN `brand` VARCHAR(255) NULL AFTER `price`;',
  'SELECT 0;'
);
PREPARE stmt FROM @qry;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @qry := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'warranties' AND COLUMN_NAME = 'model') = 0,
  'ALTER TABLE `warranties` ADD COLUMN `model` VARCHAR(255) NULL AFTER `brand`;',
  'SELECT 0;'
);
PREPARE stmt FROM @qry;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @qry := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'warranties' AND COLUMN_NAME = 'condition') = 0,
  'ALTER TABLE `warranties` ADD COLUMN `condition` VARCHAR(255) NULL AFTER `model`;',
  'SELECT 0;'
);
PREPARE stmt FROM @qry;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @qry := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'warranties' AND COLUMN_NAME = 'personal_identification_number') = 0,
  'ALTER TABLE `warranties` ADD COLUMN `personal_identification_number` VARCHAR(255) NULL AFTER `condition`;',
  'SELECT 0;'
);
PREPARE stmt FROM @qry;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @qry := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'warranties' AND COLUMN_NAME = 'admin_notes') = 0,
  'ALTER TABLE `warranties` ADD COLUMN `admin_notes` TEXT NULL AFTER `personal_identification_number`;',
  'SELECT 0;'
);
PREPARE stmt FROM @qry;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

