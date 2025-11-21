-- Migration: Add customer_last_name and customer_initial_note to service_cases table
-- Date: 2025-11-21
-- Description: Adds customer_last_name and customer_initial_note fields to service_cases table

-- Add customer_last_name column (nullable, for backward compatibility)
ALTER TABLE service_cases 
ADD COLUMN customer_last_name VARCHAR(255) NULL AFTER customer_name;

-- Add customer_initial_note column (nullable TEXT field for customer's problem description)
ALTER TABLE service_cases 
ADD COLUMN customer_initial_note TEXT NULL AFTER customer_email;

-- Optional: Add index on customer_last_name if you plan to search by it
-- ALTER TABLE service_cases ADD INDEX idx_customer_last_name (customer_last_name);

