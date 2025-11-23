#!/bin/bash

# Complete cleanup script
# Cleans both project files and Docker resources
# Usage: ./scripts/cleanup-all.sh

set -e

echo "🧹 Complete cleanup - Project files and Docker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Clean project files
echo "📁 Cleaning project files..."
./scripts/cleanup.sh

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Clean Docker (with confirmation)
read -p "Clean Docker resources? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ./scripts/cleanup-docker.sh
else
    echo "⏭️  Skipping Docker cleanup"
fi

echo ""
echo "✅ All cleanup complete!"

