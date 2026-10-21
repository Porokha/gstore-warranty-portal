-- Restore metadata lost when a visibility-only update cleared omitted fields.
-- Values come from the original trade-in SQLite catalog, matched by source ID and slug.
-- Do not change visibility, names, pricing trees, or metadata that has since been edited.
START TRANSACTION;

CREATE TEMPORARY TABLE trade_in_metadata_repair (
  source_id INT NOT NULL PRIMARY KEY,
  slug VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  brand VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  category2 VARCHAR(255) NOT NULL,
  image_src VARCHAR(1024) NOT NULL
);

INSERT INTO trade_in_metadata_repair (source_id, slug, brand, category, category2, image_src) VALUES
  (515, 'iphone/iphone-8-plus', 'Apple', 'Phone', 'Apple', '/media/cache/opt-resize/800x800/72183834-iphone-8-plus.jpg'),
  (516, 'iphone/iphone-8', 'Apple', 'Phone', 'Apple', '/media/cache/opt-resize/800x800/1061384624-iphone-8.jpg'),
  (518, 'iphone/iphone-se-2nd-gen', 'Apple', 'Phone', 'Apple', '/media/cache/opt-resize/800x800/2016140565-iphone-se-2nd-gen.jpg'),
  (519, 'iphone/iphone-se-3rd-gen', 'Apple', 'Phone', 'Apple', '/media/cache/opt-resize/800x800/2629860253-iphone-se-3rd-gen.jpg'),
  (520, 'iphone/iphone-x', 'Apple', 'Phone', 'Apple', '/media/cache/opt-resize/800x800/945402747-iphone-x.jpg'),
  (521, 'iphone/iphone-xr', 'Apple', 'Phone', 'Apple', '/media/cache/opt-resize/800x800/371620954-iphone-xr.jpg'),
  (522, 'iphone/iphone-xs-max', 'Apple', 'Phone', 'Apple', '/media/cache/opt-resize/800x800/1716868568-iphone-xs-max.jpg'),
  (523, 'iphone/iphone-xs', 'Apple', 'Phone', 'Apple', '/media/cache/opt-resize/800x800/1872394386-iphone-xs.jpg'),
  (737, 'macbook-air-2012-2017/macbook-air-11', 'Apple', 'MacBook', 'MacBook Air', '/media/cache/opt-resize/800x800/2653145955-macbook-air-11.jpg'),
  (738, 'macbook-air-2012-2017/macbook-air-13', 'Apple', 'MacBook', 'MacBook Air', '/media/cache/opt-resize/800x800/247473496-macbook-air-13.jpg'),
  (739, 'macbook-air-2018-2020/macbook-air-13-2018', 'Apple', 'MacBook', 'MacBook Air', '/media/cache/opt-resize/800x800/1137291863-macbook-air-13-2018.jpg'),
  (740, 'macbook-air-2018-2020/macbook-air-13-2019', 'Apple', 'MacBook', 'MacBook Air', '/media/cache/opt-resize/800x800/628214261-macbook-air-13-2019.jpg'),
  (741, 'macbook-air-2018-2020/macbook-air-13-2020', 'Apple', 'MacBook', 'MacBook Air', '/media/cache/opt-resize/800x800/2980303548-macbook-air-13-2020.jpg'),
  (755, 'macbook-pro-13-2016-2020/macbook-pro-13-2019', 'Apple', 'MacBook Pro', 'MacBook Pro (2016 - 2020)', '/media/cache/opt-resize/800x800/2370785494-macbook-pro-13-2019.jpg');

SELECT COUNT(*) AS matching_rows_before
FROM trade_in_products AS product
JOIN trade_in_metadata_repair AS original
  ON original.source_id = product.source_id AND original.slug = product.slug
WHERE product.brand IS NULL AND product.category IS NULL
  AND product.category2 IS NULL AND product.image_src IS NULL;

UPDATE trade_in_products AS product
JOIN trade_in_metadata_repair AS original
  ON original.source_id = product.source_id AND original.slug = product.slug
SET product.brand = COALESCE(product.brand, original.brand),
    product.category = COALESCE(product.category, original.category),
    product.category2 = COALESCE(product.category2, original.category2),
    product.image_src = COALESCE(product.image_src, original.image_src)
WHERE product.brand IS NULL OR product.category IS NULL
  OR product.category2 IS NULL OR product.image_src IS NULL;

SELECT ROW_COUNT() AS repaired_rows;
COMMIT;
