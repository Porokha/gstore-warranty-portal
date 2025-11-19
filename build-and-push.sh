#!/bin/bash

# Script to build frontend locally and push to GitHub
# Usage: ./build-and-push.sh

set -e  # Exit on error

echo "🔨 Building frontend..."
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build production bundle
echo "🏗️  Building production bundle..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

cd ..

# Check if build folder exists
if [ ! -d "frontend/build" ]; then
    echo "❌ Build folder not found!"
    exit 1
fi

echo "📦 Committing build to Git..."
git add -f frontend/build
git commit -m "Update production build - $(date +%Y-%m-%d\ %H:%M:%S)" || echo "No changes to commit"

echo "🚀 Pushing to GitHub..."
git push

echo ""
echo "✅ Done! Build pushed to GitHub."
echo ""
echo "📋 Next steps on server:"
echo "   1. git pull"
echo "   2. docker compose -f docker-compose.prod.prebuilt.yml up -d"
echo ""

