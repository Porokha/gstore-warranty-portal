#!/bin/bash
# Script to build frontend with correct environment variables for production
# Usage: ./scripts/build-frontend.sh

set -e

# Server IP (update this if your server IP changes)
SERVER_IP=${SERVER_IP:-3.68.134.145}

echo "Building frontend for production server: $SERVER_IP"
echo ""

cd frontend

# Build with production environment variables
REACT_APP_API_URL="http://${SERVER_IP}:3000/api" \
REACT_APP_PORTAL_URL="http://${SERVER_IP}:3001" \
npm run build

echo ""
echo "✅ Frontend built successfully!"
echo ""
echo "Next steps:"
echo "  1. git add frontend/build/"
echo "  2. git commit -m 'Rebuild frontend'"
echo "  3. git push"
echo "  4. On server: git pull && docker compose -f docker-compose.prod.prebuilt.yml restart frontend"

