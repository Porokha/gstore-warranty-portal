#!/bin/bash
# Script to update frontend build files on server
# Usage: ./scripts/update-frontend.sh

set -e

echo "Updating frontend build files..."

# Pull latest changes
echo "1. Pulling latest changes from GitHub..."
git pull

# Verify build files exist
if [ ! -d "frontend/build" ]; then
    echo "❌ Error: frontend/build directory not found!"
    exit 1
fi

if [ ! -f "frontend/build/index.html" ]; then
    echo "❌ Error: frontend/build/index.html not found!"
    exit 1
fi

echo "✅ Build files found"

# Restart frontend container to pick up new files
echo "2. Restarting frontend container..."
docker compose -f docker-compose.prod.prebuilt.yml restart frontend

echo "✅ Frontend updated and restarted!"
echo ""
echo "Check if it's working:"
echo "  docker compose -f docker-compose.prod.prebuilt.yml logs frontend --tail=20"

