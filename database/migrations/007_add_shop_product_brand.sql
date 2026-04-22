-- 007_add_shop_product_brand.sql
ALTER TABLE shop_products
  ADD COLUMN brand VARCHAR(255) NULL AFTER title;
