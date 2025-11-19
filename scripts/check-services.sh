#!/bin/bash

# Script to check if all services are working
# Usage: ./scripts/check-services.sh

set -e

IP=${1:-localhost}

echo "🔍 Checking services on $IP..."
echo ""

# Check backend health
echo "1. Backend Health Check:"
echo "   http://$IP:3000/api/health"
curl -s http://$IP:3000/api/health || echo "   ❌ Backend not responding"
echo ""
echo ""

# Check backend API docs
echo "2. Backend API Docs:"
echo "   http://$IP:3000/api/docs"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$IP:3000/api/docs || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ API docs accessible"
else
    echo "   ❌ API docs not accessible (HTTP $HTTP_CODE)"
fi
echo ""
echo ""

# Check frontend
echo "3. Frontend:"
echo "   http://$IP:3001"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$IP:3001 || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Frontend accessible"
else
    echo "   ❌ Frontend not accessible (HTTP $HTTP_CODE)"
fi
echo ""
echo ""

# Check container status
echo "4. Container Status:"
docker-compose -f docker-compose.prod.yml ps
echo ""
echo ""

# Check backend logs for errors
echo "5. Recent Backend Logs (last 20 lines):"
docker-compose -f docker-compose.prod.yml logs --tail=20 backend
echo ""
echo ""

# Check if backend is listening on port 3000
echo "6. Backend Port Check:"
docker-compose -f docker-compose.prod.yml exec backend netstat -tuln | grep 3000 || echo "   ⚠️  Port 3000 not listening inside container"
echo ""

