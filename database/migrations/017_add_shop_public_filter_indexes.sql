CREATE INDEX idx_shop_products_public_base
ON shop_products (is_active, deleted_at, device_category, part_category, inventory_source, sort_order, id);

CREATE INDEX idx_shop_products_public_brand
ON shop_products (is_active, deleted_at, brand(80), sort_order, id);

CREATE INDEX idx_shop_products_public_model
ON shop_products (is_active, deleted_at, device_model(120), sort_order, id);
