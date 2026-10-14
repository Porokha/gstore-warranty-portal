-- Recomputed from each product's condition range with the customer's chosen storage.
-- All listed pricing trees predate these requests. Leave cancelled quote 42 untouched.
START TRANSACTION;

UPDATE trade_in_quotes
SET final_price = CASE id
  WHEN 51 THEN 950
  WHEN 58 THEN 950
  WHEN 62 THEN 200
  WHEN 63 THEN 950
  WHEN 84 THEN 300
  WHEN 95 THEN 1700
  WHEN 113 THEN 200
  WHEN 114 THEN 200
  WHEN 115 THEN 450
END
WHERE id IN (51, 58, 62, 63, 84, 95, 113, 114, 115)
  AND final_price = 0
  AND status <> 'cancelled'
  AND JSON_SEARCH(pricing_path, 'one', 'manual_assessment') IS NOT NULL;

SELECT ROW_COUNT() AS updated_quotes;

-- Quote 114 has an opened, unsigned agreement draft copied from its former zero price.
UPDATE trade_in_agreements
SET details = JSON_SET(details, '$.final_price', 200)
WHERE quote_id = 114
  AND finalized_at IS NULL
  AND customer_signed_at IS NULL
  AND customer_signature IS NULL
  AND representative_signature IS NULL
  AND CAST(JSON_UNQUOTE(JSON_EXTRACT(details, '$.final_price')) AS DECIMAL(12, 2)) = 0;

SELECT ROW_COUNT() AS updated_unsigned_drafts;

COMMIT;
