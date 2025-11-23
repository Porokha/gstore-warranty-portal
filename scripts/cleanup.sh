#!/bin/bash

# Cleanup script to remove unnecessary files
# Usage: ./scripts/cleanup.sh

set -e

echo "🧹 Cleaning up unnecessary files..."
echo ""

# Remove node_modules (can be reinstalled)
echo "📦 Removing node_modules..."
find . -name "node_modules" -type d -prune -exec rm -rf {} + 2>/dev/null || true

# Remove build artifacts that shouldn't be in git
echo "🗑️  Removing build artifacts..."
find . -name ".next" -type d -prune -exec rm -rf {} + 2>/dev/null || true
find . -name "out" -type d -prune -exec rm -rf {} + 2>/dev/null || true
find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true

# Remove logs
echo "📝 Removing log files..."
find . -name "*.log" -type f -delete 2>/dev/null || true
find . -name "npm-debug.log*" -type f -delete 2>/dev/null || true
find . -name "yarn-debug.log*" -type f -delete 2>/dev/null || true
find . -name "yarn-error.log*" -type f -delete 2>/dev/null || true

# Remove cache directories
echo "💾 Removing cache directories..."
find . -name ".cache" -type d -prune -exec rm -rf {} + 2>/dev/null || true
find . -name ".parcel-cache" -type d -prune -exec rm -rf {} + 2>/dev/null || true
find . -name ".eslintcache" -type f -delete 2>/dev/null || true
find . -name ".pnp" -type d -prune -exec rm -rf {} + 2>/dev/null || true
find . -name ".pnp.js" -type f -delete 2>/dev/null || true

# Remove coverage reports
echo "📊 Removing coverage reports..."
find . -name "coverage" -type d -prune -exec rm -rf {} + 2>/dev/null || true

# Remove OS files
echo "🖥️  Removing OS files..."
find . -name ".DS_Store" -type f -delete 2>/dev/null || true
find . -name "Thumbs.db" -type f -delete 2>/dev/null || true
find . -name "*.swp" -type f -delete 2>/dev/null || true
find . -name "*.swo" -type f -delete 2>/dev/null || true
find . -name "*~" -type f -delete 2>/dev/null || true

# Remove IDE files
echo "💻 Removing IDE files..."
find . -name ".vscode" -type d -prune -exec rm -rf {} + 2>/dev/null || true
find . -name ".idea" -type d -prune -exec rm -rf {} + 2>/dev/null || true

# Remove Docker build cache (optional - uncomment if needed)
# echo "🐳 Cleaning Docker build cache..."
# docker system prune -f 2>/dev/null || true

# Remove temporary uploads (keep structure)
echo "📁 Cleaning temporary uploads..."
find ./backend/uploads -type f -name "*.tmp" -delete 2>/dev/null || true
find ./backend/uploads/imports -type f -mtime +7 -delete 2>/dev/null || true  # Delete imports older than 7 days

# Remove old build artifacts (keep current builds)
echo "🏗️  Cleaning old build artifacts..."
# Keep frontend/build and backend/dist, but remove any .old or backup versions
find . -name "*.old" -type f -delete 2>/dev/null || true
find . -name "*.bak" -type f -delete 2>/dev/null || true

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "To reinstall dependencies:"
echo "  cd frontend && npm install"
echo "  cd ../backend && npm install"

