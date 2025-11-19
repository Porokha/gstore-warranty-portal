-- Gstore Warranty Portal Database Schema
-- This is a reference schema. Use TypeORM migrations for actual database setup.

-- Users (Staff)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'technician') DEFAULT 'technician',
    phone VARCHAR(50),
    email VARCHAR(255),
    language_pref ENUM('en', 'ka') DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Warranties
CREATE TABLE IF NOT EXISTS warranties (
    id INT PRIMARY KEY AUTO_INCREMENT,
    warranty_id VARCHAR(255) UNIQUE NOT NULL,
    order_id INT,
    product_id INT,
    order_line_index INT,
    sku VARCHAR(255) NOT NULL,
    imei VARCHAR(255),
    serial_number VARCHAR(255) NOT NULL,
    device_type VARCHAR(100) DEFAULT 'Laptop',
    title VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    price DECIMAL(10, 2) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_last_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255),
    purchase_date DATE NOT NULL,
    warranty_start DATE NOT NULL,
    warranty_end DATE NOT NULL,
    extended_days INT DEFAULT 0,
    created_source ENUM('auto_woo', 'manual') DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_warranty_id (warranty_id),
    INDEX idx_order_id (order_id),
    INDEX idx_customer_phone (customer_phone)
);

-- Service Cases
CREATE TABLE IF NOT EXISTS service_cases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    warranty_id INT,
    sku VARCHAR(255) NOT NULL,
    imei VARCHAR(255),
    serial_number VARCHAR(255) NOT NULL,
    device_type VARCHAR(100) NOT NULL,
    product_title VARCHAR(500) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255),
    order_id INT,
    product_id INT,
    opened_at DATETIME NOT NULL,
    closed_at DATETIME,
    deadline_at DATETIME NOT NULL,
    status_level INT DEFAULT 1,
    result_type ENUM('covered', 'payable', 'returned', 'replaceable'),
    priority ENUM('low', 'normal', 'high', 'critical') DEFAULT 'normal',
    tags JSON,
    assigned_technician_id INT,
    created_by INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (warranty_id) REFERENCES warranties(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_technician_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_case_number (case_number),
    INDEX idx_status_level (status_level),
    INDEX idx_customer_phone (customer_phone),
    INDEX idx_deadline_at (deadline_at)
);

-- Case Status History
CREATE TABLE IF NOT EXISTS case_status_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    changed_by INT NOT NULL,
    previous_status_level INT,
    new_status_level INT NOT NULL,
    previous_result ENUM('covered', 'payable', 'returned', 'replaceable'),
    new_result ENUM('covered', 'payable', 'returned', 'replaceable'),
    note_public TEXT,
    note_private TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES service_cases(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id),
    INDEX idx_case_id (case_id),
    INDEX idx_created_at (created_at)
);

-- Case Payments
CREATE TABLE IF NOT EXISTS case_payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    offer_type ENUM('covered', 'payable', 'replaceable') NOT NULL,
    offer_amount DECIMAL(10, 2),
    payment_method ENUM('onsite', 'online'),
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    bog_transaction_id VARCHAR(255),
    estimated_days_after_payment INT,
    generated_code VARCHAR(6),
    code_status ENUM('active', 'used'),
    code_generated_at DATETIME,
    code_used_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES service_cases(id) ON DELETE CASCADE,
    INDEX idx_case_id (case_id),
    INDEX idx_payment_status (payment_status)
);

-- Case Files
CREATE TABLE IF NOT EXISTS case_files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type ENUM('image', 'video', 'pdf', 'other') NOT NULL,
    uploaded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES service_cases(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    INDEX idx_case_id (case_id)
);

-- SMS Templates
CREATE TABLE IF NOT EXISTS sms_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    `key` VARCHAR(255) NOT NULL,
    language ENUM('en', 'ka') NOT NULL,
    template_text TEXT NOT NULL,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id),
    UNIQUE KEY unique_key_lang (`key`, language)
);

-- SMS Settings
CREATE TABLE IF NOT EXISTS sms_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    global_enabled BOOLEAN DEFAULT TRUE,
    send_on_warranty_created BOOLEAN DEFAULT TRUE,
    send_on_case_opened BOOLEAN DEFAULT TRUE,
    send_on_status_change BOOLEAN DEFAULT TRUE,
    send_on_offer_created BOOLEAN DEFAULT TRUE,
    send_on_payment_confirmed BOOLEAN DEFAULT TRUE,
    send_on_case_completed BOOLEAN DEFAULT TRUE,
    send_on_sla_due BOOLEAN DEFAULT TRUE,
    send_on_sla_stalled BOOLEAN DEFAULT TRUE,
    send_on_sla_deadline_1day BOOLEAN DEFAULT TRUE,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- SMS Logs
CREATE TABLE IF NOT EXISTS sms_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone VARCHAR(50) NOT NULL,
    template_key VARCHAR(255) NOT NULL,
    payload_json JSON,
    status ENUM('sent', 'failed', 'skipped') NOT NULL,
    api_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_created_at (created_at)
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    payload_json JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);

