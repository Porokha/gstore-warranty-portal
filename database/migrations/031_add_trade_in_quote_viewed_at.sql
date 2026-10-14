ALTER TABLE trade_in_quotes
  ADD COLUMN viewed_at DATETIME NULL AFTER status;

UPDATE trade_in_quotes SET viewed_at = updated_at WHERE viewed_at IS NULL;
