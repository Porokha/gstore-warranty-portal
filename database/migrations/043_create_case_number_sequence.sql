CREATE TABLE IF NOT EXISTS case_number_sequence (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  last_number BIGINT UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO case_number_sequence (id, last_number)
SELECT 1, COALESCE(MAX(CAST(SUBSTRING(case_number, 5) AS UNSIGNED)), 0)
FROM service_cases
WHERE case_number REGEXP '^SCN-[0-9]+$'
ON DUPLICATE KEY UPDATE last_number = GREATEST(last_number, VALUES(last_number));
