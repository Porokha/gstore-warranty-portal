ALTER TABLE users
MODIFY role ENUM('admin', 'manager', 'technician') NOT NULL DEFAULT 'technician';
