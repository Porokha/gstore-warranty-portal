ALTER TABLE trade_in_vouchers
  ADD COLUMN pos_order_id VARCHAR(120) NULL AFTER redeemed_by_user_id,
  ADD COLUMN pos_order_number VARCHAR(120) NULL AFTER pos_order_id,
  ADD COLUMN pos_applied_amount DECIMAL(12,2) NULL AFTER pos_order_number,
  ADD INDEX idx_trade_in_voucher_pos_order (pos_order_id);
