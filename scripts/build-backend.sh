#!/bin/bash

# Build script for backend
# This builds the backend locally and prepares it for Docker

set -e

echo "🔨 Building backend for production..."

cd "$(dirname "$0")/../backend"

# Check if node_modules exists, if not install
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the application
echo "🏗️  Building TypeScript..."
npm run build

# Verify build
if [ ! -d "dist" ] || [ ! -f "dist/main.js" ]; then
    echo "❌ Build failed! dist/main.js not found"
    exit 1
fi

echo "✅ Backend built successfully!"
echo "📁 Build output: backend/dist/"
echo ""
echo "Next steps:"
echo "  docker compose -f docker-compose.prod.prebuilt.yml build backend"
echo "  docker compose -f docker-compose.prod.prebuilt.yml up -d"

