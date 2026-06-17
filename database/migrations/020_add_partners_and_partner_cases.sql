CREATE TABLE IF NOT EXISTS partners (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    notes TEXT,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_partner_name (name),
    INDEX idx_partner_phone (phone),
    INDEX idx_partner_active (active)
);

ALTER TABLE service_cases
ADD COLUMN case_type ENUM('standard', 'partner') NOT NULL DEFAULT 'standard' AFTER warranty_id,
ADD COLUMN partner_id INT NULL AFTER case_type,
MODIFY COLUMN customer_name VARCHAR(255) NULL,
MODIFY COLUMN customer_phone VARCHAR(50) NULL,
ADD INDEX idx_case_type (case_type),
ADD INDEX idx_partner_id (partner_id),
ADD CONSTRAINT fk_service_cases_partner
    FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE SET NULL;
