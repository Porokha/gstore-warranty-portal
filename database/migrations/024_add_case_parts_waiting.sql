ALTER TABLE service_cases
  ADD COLUMN parts_waiting BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN parts_waiting_started_at DATETIME NULL;

CREATE INDEX idx_service_cases_parts_waiting ON service_cases (parts_waiting);
