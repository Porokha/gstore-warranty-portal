-- 006_make_shop_product_price_nullable.sql
ALTER TABLE shop_products
  MODIFY COLUMN price DECIMAL(10,2) NULL DEFAULT NULL;
