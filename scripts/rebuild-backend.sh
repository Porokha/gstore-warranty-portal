#!/bin/bash

# Script to rebuild and restart backend
# Usage: ./scripts/rebuild-backend.sh

set -e

echo "🔄 Rebuilding backend..."

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull

# Rebuild backend
echo "🔨 Building backend container..."
docker-compose -f docker-compose.prod.yml build --no-cache backend

# Restart backend
echo "🔄 Restarting backend..."
docker-compose -f docker-compose.prod.yml up -d backend

# Wait for it to start
echo "⏳ Waiting for backend to start..."
sleep 15

# Check logs
echo "📋 Recent backend logs:"
docker-compose -f docker-compose.prod.yml logs --tail=30 backend

echo ""
echo "✅ Done! Check the logs above to see if backend started successfully."

