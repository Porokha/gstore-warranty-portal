ALTER TABLE shop_products
  ADD COLUMN supplier_auto_sync_disabled BOOLEAN NOT NULL DEFAULT FALSE AFTER supplier_synced_at;
