ALTER TABLE trade_in_quotes
  MODIFY COLUMN status ENUM('pending', 'contacted', 'no_answer', 'accepted', 'completed', 'cancelled')
  NOT NULL DEFAULT 'pending';
