ALTER TABLE shop_products
  ADD COLUMN supplier ENUM('manual', 'mobilesentrix') NOT NULL DEFAULT 'manual' AFTER is_active,
  ADD COLUMN supplier_product_id VARCHAR(100) NULL AFTER supplier,
  ADD COLUMN supplier_sku VARCHAR(100) NULL AFTER supplier_product_id,
  ADD COLUMN supplier_price_usd DECIMAL(10, 2) NULL AFTER supplier_sku,
  ADD COLUMN supplier_exchange_rate DECIMAL(10, 4) NULL AFTER supplier_price_usd,
  ADD COLUMN supplier_payload JSON NULL AFTER supplier_exchange_rate,
  ADD COLUMN supplier_synced_at DATETIME NULL AFTER supplier_payload,
  ADD INDEX idx_shop_products_supplier (supplier, supplier_product_id),
  ADD INDEX idx_shop_products_supplier_sku (supplier, supplier_sku);
