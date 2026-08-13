-- Speed up staff admin warranty and service-case listing/search filters.

CREATE INDEX idx_warranties_created_at ON warranties(created_at);
CREATE INDEX idx_warranties_device_type ON warranties(device_type);
CREATE INDEX idx_warranties_product_id ON warranties(product_id);
CREATE INDEX idx_warranties_serial_number ON warranties(serial_number);
CREATE INDEX idx_warranties_sku ON warranties(sku);
CREATE INDEX idx_warranties_imei ON warranties(imei);
CREATE INDEX idx_warranties_warranty_end ON warranties(warranty_end);

CREATE INDEX idx_service_cases_opened_at ON service_cases(opened_at);
CREATE INDEX idx_service_cases_status_opened ON service_cases(status_level, opened_at);
CREATE INDEX idx_service_cases_assigned_status ON service_cases(assigned_technician_id, status_level);
CREATE INDEX idx_service_cases_partner_opened ON service_cases(partner_id, opened_at);
