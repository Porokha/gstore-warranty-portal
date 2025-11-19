#!/bin/bash

# Cleanup script before rebuilding frontend
# Usage: ./cleanup-before-build.sh

set -e

echo "🧹 Cleaning up before build..."
echo ""

# Step 1: Stop containers
echo "⏹️  Stopping containers..."
docker compose down 2>/dev/null || true

# Step 2: Clean Docker system (removes stopped containers, unused images, build cache)
echo "🗑️  Cleaning Docker system..."
docker system prune -a -f

# Step 3: Remove old frontend images specifically
echo "🗑️  Removing old frontend images..."
docker images | grep -E 'frontend|gstore.*frontend' | awk '{print $3}' | xargs docker rmi 2>/dev/null || echo "No frontend images to remove"

# Step 4: Clean build cache
echo "🗑️  Cleaning build cache..."
docker builder prune -a -f

# Step 5: Show disk usage
echo ""
echo "📊 Current disk usage:"
df -h | grep -E 'Filesystem|/dev/' | head -3

echo ""
echo "📦 Docker disk usage:"
docker system df

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "You can now run:"
echo "  docker compose build frontend --no-cache --progress=plain"

