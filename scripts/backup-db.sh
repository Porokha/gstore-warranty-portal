#!/bin/bash

# Database backup script
# Usage: ./scripts/backup-db.sh

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/gstore_warranty_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Get database password from .env
if [ ! -f "backend/.env" ]; then
    echo "❌ backend/.env file not found!"
    exit 1
fi

db_password=$(grep "^DB_PASSWORD=" backend/.env | cut -d '=' -f2 | tr -d '"' | tr -d "'")

echo "💾 Creating database backup..."
docker-compose -f docker-compose.prod.yml exec -T db mysqldump -u gstore -p"$db_password" gstore_warranty > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup created: $BACKUP_FILE"
    
    # Compress backup
    gzip "$BACKUP_FILE"
    echo "✅ Backup compressed: $BACKUP_FILE.gz"
    
    # Show backup size
    ls -lh "$BACKUP_FILE.gz"
else
    echo "❌ Backup failed!"
    exit 1
fi

