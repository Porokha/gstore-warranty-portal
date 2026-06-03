ALTER TABLE shop_products
  ADD COLUMN device_model VARCHAR(255) NULL AFTER issue_label,
  ADD COLUMN quality_line VARCHAR(255) NULL AFTER device_model,
  ADD COLUMN quality_badge VARCHAR(255) NULL AFTER quality_line,
  ADD COLUMN warranty_line VARCHAR(255) NULL AFTER quality_badge,
  ADD COLUMN gallery_images JSON NULL AFTER image_url,
  ADD COLUMN compatibility_tags JSON NULL AFTER gallery_images,
  ADD COLUMN search_tags JSON NULL AFTER compatibility_tags;
