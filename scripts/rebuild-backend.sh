#!/bin/bash
# Script to rebuild backend with proper cache busting

set -e

echo "=== Rebuilding Backend ==="

cd "$(dirname "$0")/../backend" || exit 1

# Step 1: Build the TypeScript code
echo "Building TypeScript..."
npm run build

# Step 2: Create a build timestamp file in dist to bust Docker cache
echo "Creating build timestamp..."
echo "$(date +%s)" > dist/.build-timestamp
echo "Build timestamp: $(cat dist/.build-timestamp)"

# Step 3: Build Docker image with cache bust
echo "Building Docker image..."
cd ..
BUILD_TIMESTAMP=$(date +%s)
docker compose -f docker-compose.prod.prebuilt.yml build \
  --build-arg CACHE_BUST="${BUILD_TIMESTAMP}" \
  --no-cache \
  backend

echo "=== Backend rebuild complete ==="
