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

# Step 3: Build Docker image with cache bust
echo "Building Docker image..."
cd ..
BUILD_TIMESTAMP=$(date +%s)
docker compose -f docker-compose.prod.prebuilt.yml build \
  --build-arg CACHE_BUST="${BUILD_TIMESTAMP}" \
  --no-cache \
  backend

echo "=== Backend rebuild complete ==="
