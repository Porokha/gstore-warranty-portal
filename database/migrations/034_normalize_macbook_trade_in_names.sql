UPDATE trade_in_products
SET name = CONCAT(LEFT(RTRIM(name), CHAR_LENGTH(RTRIM(name)) - 1), CHAR(34))
WHERE name LIKE 'MacBook%'
  AND RIGHT(RTRIM(name), 1) IN (CHAR(92), CHAR(47))
  AND RIGHT(LEFT(RTRIM(name), CHAR_LENGTH(RTRIM(name)) - 1), 1) BETWEEN '0' AND '9';
