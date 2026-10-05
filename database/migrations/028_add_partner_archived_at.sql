ALTER TABLE partners
ADD COLUMN archived_at DATETIME NULL AFTER active,
ADD INDEX idx_partner_archived_at (archived_at);
