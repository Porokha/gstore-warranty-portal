-- 002_add_warranty_admin_fields.sql
-- Adds admin-only warranty columns (brand/model/condition/PIN/admin_notes)
ALTER TABLE `warranties`
  ADD COLUMN `brand` VARCHAR(255) NULL AFTER `price`,
  ADD COLUMN `model` VARCHAR(255) NULL AFTER `brand`,
  ADD COLUMN `condition` VARCHAR(255) NULL AFTER `model`,
  ADD COLUMN `personal_identification_number` VARCHAR(255) NULL AFTER `condition`,
  ADD COLUMN `admin_notes` TEXT NULL AFTER `personal_identification_number`;
