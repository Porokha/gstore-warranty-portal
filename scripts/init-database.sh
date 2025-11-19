#!/bin/bash

# Script to initialize database schema
# Usage: ./scripts/init-database.sh

set -e

echo "🗄️  Initializing database schema..."

# Get database password from .env
if [ ! -f "backend/.env" ]; then
    echo "❌ ERROR: backend/.env file not found!"
    exit 1
fi

DB_PASSWORD=$(grep "^DB_PASSWORD=" backend/.env | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)

if [ -z "$DB_PASSWORD" ]; then
    echo "❌ ERROR: DB_PASSWORD not set in backend/.env"
    exit 1
fi

# Check if database container is running
if ! docker-compose -f docker-compose.prod.yml ps db | grep -q "Up"; then
    echo "❌ ERROR: Database container is not running!"
    echo "Please start it first: docker-compose -f docker-compose.prod.yml up -d db"
    exit 1
fi

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check if schema file exists
if [ ! -f "database/schema.sql" ]; then
    echo "❌ ERROR: database/schema.sql not found!"
    exit 1
fi

# Run schema
echo "📋 Creating database tables..."
docker-compose -f docker-compose.prod.yml exec -T db mysql -u gstore -p"$DB_PASSWORD" gstore_warranty < database/schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Database schema created successfully!"
    echo ""
    echo "📝 Next step: Create admin user"
    echo "   Run: ./scripts/create-admin.sh"
else
    echo "❌ Failed to create database schema!"
    exit 1
fi

