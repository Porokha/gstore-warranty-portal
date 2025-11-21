# Migration 001: Add Customer Fields to Service Cases

## Overview
This migration adds two new fields to the `service_cases` table:
- `customer_last_name` (VARCHAR(255), nullable)
- `customer_initial_note` (TEXT, nullable)

## Files
- **Migration SQL**: `database/migrations/001_add_case_customer_fields.sql`
- **Migration Script**: `scripts/run-migration-001.sh`

## Running the Migration

### Option 1: Using the Migration Script (Recommended)

On your server:

```bash
cd ~/gstore-warranty-portal

# Pull latest changes
git pull

# Make script executable (if needed)
chmod +x scripts/run-migration-001.sh

# Run migration (inside Docker container)
docker compose -f docker-compose.prod.prebuilt.yml exec backend bash -c "cd /app && bash scripts/run-migration-001.sh"

# OR if you have database credentials in environment
export DB_HOST=db
export DB_PORT=3306
export DB_NAME=gstore_warranty
export DB_USER=gstore
export DB_PASSWORD=gstore123
./scripts/run-migration-001.sh
```

### Option 2: Manual SQL Execution

Connect to your MySQL database and run:

```sql
-- Add customer_last_name column
ALTER TABLE service_cases 
ADD COLUMN customer_last_name VARCHAR(255) NULL AFTER customer_name;

-- Add customer_initial_note column
ALTER TABLE service_cases 
ADD COLUMN customer_initial_note TEXT NULL AFTER customer_email;
```

### Option 3: Using Docker Exec

```bash
# Connect to database container
docker compose -f docker-compose.prod.prebuilt.yml exec db mysql -u gstore -pgstore123 gstore_warranty

# Then run the SQL commands from Option 2
```

### Option 4: Copy SQL file into container

```bash
# Copy migration file to container
docker compose -f docker-compose.prod.prebuilt.yml cp database/migrations/001_add_case_customer_fields.sql db:/tmp/migration.sql

# Execute migration
docker compose -f docker-compose.prod.prebuilt.yml exec db mysql -u gstore -pgstore123 gstore_warranty < /tmp/migration.sql
```

## Verification

After running the migration, verify the columns were added:

```sql
DESCRIBE service_cases;
```

You should see:
- `customer_last_name` after `customer_name`
- `customer_initial_note` after `customer_email`

## Rollback (if needed)

If you need to rollback this migration:

```sql
ALTER TABLE service_cases DROP COLUMN customer_initial_note;
ALTER TABLE service_cases DROP COLUMN customer_last_name;
```

## Notes
- Both fields are nullable, so existing records won't be affected
- No data loss will occur
- The migration is safe to run on production

