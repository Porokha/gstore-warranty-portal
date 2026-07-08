ALTER TABLE users
MODIFY role ENUM('admin', 'manager', 'super_technician', 'technician') NOT NULL DEFAULT 'technician';

ALTER TABLE users
ADD COLUMN is_postponed TINYINT(1) NOT NULL DEFAULT 0;
