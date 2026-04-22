ALTER TABLE shop_orders
  ADD COLUMN viewed_at DATETIME NULL AFTER source;
