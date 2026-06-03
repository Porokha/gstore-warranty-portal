ALTER TABLE shop_products
  ADD COLUMN supplier_currency VARCHAR(10) NULL AFTER supplier_price_usd;
