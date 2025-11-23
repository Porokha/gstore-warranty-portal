#!/bin/bash

# Docker cleanup script
# Removes unused Docker images, containers, and volumes
# Usage: ./scripts/cleanup-docker.sh

set -e

echo "🐳 Cleaning up Docker resources..."
echo ""

# Stop all containers
echo "🛑 Stopping containers..."
docker compose -f docker-compose.prod.prebuilt.yml down 2>/dev/null || true

# Remove unused containers
echo "🗑️  Removing stopped containers..."
docker container prune -f

# Remove unused images
echo "🖼️  Removing unused images..."
docker image prune -f

# Remove unused volumes (be careful - this removes volumes not used by any container)
echo "💾 Removing unused volumes..."
docker volume prune -f

# Remove build cache (optional - saves space but slows next build)
read -p "Remove Docker build cache? This will slow down next build. (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing build cache..."
    docker builder prune -f
fi

# Show disk usage
echo ""
echo "📊 Docker disk usage:"
docker system df

echo ""
echo "✅ Docker cleanup complete!"

