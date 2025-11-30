#!/bin/bash
# Script to rebuild backend with proper cache busting
# For prebuilt backend: assumes dist folder exists from git
# For local development: will build if dist doesn't exist

set -e

echo "=== Rebuilding Backend ==="

cd "$(dirname "$0")/../backend" || exit 1

# Step 1: Build TypeScript only if dist doesn't exist (for local dev)
if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
  echo "dist folder not found, building TypeScript..."
  if ! command -v npm &> /dev/null; then
    echo "ERROR: npm not found. Cannot build. Please ensure dist folder exists from git."
    exit 1
  fi
  npm run build
else
  echo "Using existing dist folder from git (prebuilt backend)"
fi

# Step 2: Create a build timestamp file in dist to bust Docker cache
echo "Creating build timestamp..."
mkdir -p dist
echo "$(date +%s)" > dist/.build-timestamp
echo "Build timestamp: $(cat dist/.build-timestamp)"

# Step 3: Stop and remove old container/image
echo "Stopping and removing old container..."
cd ..
docker compose -f docker-compose.prod.prebuilt.yml stop backend 2>/dev/null || true
docker compose -f docker-compose.prod.prebuilt.yml rm -f backend 2>/dev/null || true
docker rmi gstore-warranty-portal-backend:latest 2>/dev/null || true

# Step 4: Build Docker image with cache bust
echo "Building Docker image..."
BUILD_TIMESTAMP=$(date +%s)
docker compose -f docker-compose.prod.prebuilt.yml build \
  --build-arg CACHE_BUST="${BUILD_TIMESTAMP}" \
  --no-cache \
  backend

# Step 5: Start the new container
echo "Starting backend container..."
docker compose -f docker-compose.prod.prebuilt.yml up -d backend

# Step 6: Verify the code is correct inside the container
echo "Verifying code in container..."
sleep 2
if docker compose -f docker-compose.prod.prebuilt.yml exec -T backend grep -q "Starting warranty CSV import" /app/dist/import/import.service.js 2>/dev/null; then
  echo "✓ New code verified in container"
else
  echo "✗ WARNING: Code verification failed - container may have old code"
fi

echo "=== Backend rebuild complete ==="
echo "Check logs with: docker compose -f docker-compose.prod.prebuilt.yml logs -f backend"
