ALTER TABLE mobilesentrix_sync_jobs
  ADD COLUMN skipped INT NOT NULL DEFAULT 0 AFTER updated;
