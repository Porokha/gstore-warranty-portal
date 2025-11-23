#!/bin/bash

# Build script for both frontend and backend
# This builds everything locally for fast Docker deployment

set -e

echo "🚀 Building both frontend and backend for production..."
echo ""

# Build backend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Building Backend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
./scripts/build-backend.sh

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Building Frontend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
./scripts/build-frontend.sh

echo ""
echo "✅ All builds complete!"
echo ""
echo "Next steps on server:"
echo "  1. git pull"
echo "  2. docker compose -f docker-compose.prod.prebuilt.yml build --no-cache backend"
echo "  3. docker compose -f docker-compose.prod.prebuilt.yml up -d"

