ALTER TABLE shop_orders
  ADD COLUMN heard_about VARCHAR(50) NULL AFTER customer_email,
  ADD COLUMN has_partner_warranty TINYINT(1) NOT NULL DEFAULT 0 AFTER heard_about,
  ADD COLUMN partner_warranty_id VARCHAR(120) NULL AFTER has_partner_warranty;
