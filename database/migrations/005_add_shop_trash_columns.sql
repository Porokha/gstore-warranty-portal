ALTER TABLE shop_products
    ADD COLUMN deleted_at DATETIME NULL AFTER is_active,
    ADD INDEX idx_shop_products_deleted_at (deleted_at);

ALTER TABLE shop_orders
    ADD COLUMN deleted_at DATETIME NULL AFTER source,
    ADD INDEX idx_shop_orders_deleted_at (deleted_at);
