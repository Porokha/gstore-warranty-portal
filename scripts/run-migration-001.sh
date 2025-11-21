#!/bin/bash
# Script to run migration 001: Add customer_last_name and customer_initial_note to service_cases
# Usage: ./scripts/run-migration-001.sh

set -e

echo "Running migration 001: Add customer fields to service_cases table..."

# Get database credentials from environment or use defaults
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_NAME=${DB_NAME:-gstore_warranty}
DB_USER=${DB_USER:-gstore}
DB_PASSWORD=${DB_PASSWORD:-gstore123}

# Check if running in Docker
if [ -f /.dockerenv ] || [ -n "$DOCKER_CONTAINER" ]; then
    DB_HOST=${DB_HOST:-db}
fi

echo "Connecting to database: $DB_NAME on $DB_HOST:$DB_PORT"

# Run the migration
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < database/migrations/001_add_case_customer_fields.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration 001 completed successfully!"
    echo "Added columns: customer_last_name, customer_initial_note"
else
    echo "❌ Migration failed!"
    exit 1
fi

