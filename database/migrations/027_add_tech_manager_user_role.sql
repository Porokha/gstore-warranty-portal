ALTER TABLE users
MODIFY role ENUM('admin', 'manager', 'tech-manager', 'super_technician', 'technician') NOT NULL DEFAULT 'technician';
