ALTER TABLE shop_products
  ADD COLUMN service_sale_price DECIMAL(10, 2) NULL DEFAULT NULL AFTER service_price;
