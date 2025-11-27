-- 002_add_warranty_admin_fields.sql
-- Adds admin-only warranty columns (brand/model/condition/PIN/admin_notes)
ALTER TABLE `warranties`
  ADD COLUMN IF NOT EXISTS `brand` VARCHAR(255) NULL AFTER `price`,
  ADD COLUMN IF NOT EXISTS `model` VARCHAR(255) NULL AFTER `brand`,
  ADD COLUMN IF NOT EXISTS `condition` VARCHAR(255) NULL AFTER `model`,
  ADD COLUMN IF NOT EXISTS `personal_identification_number` VARCHAR(255) NULL AFTER `condition`,
  ADD COLUMN IF NOT EXISTS `admin_notes` TEXT NULL AFTER `personal_identification_number`;
