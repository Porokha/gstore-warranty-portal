#!/bin/bash
# Complete deployment script for server
# Usage: Run this on your server after git pull

set -e

echo "🚀 Starting complete deployment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Pull latest changes
echo -e "${YELLOW}Step 1: Pulling latest changes...${NC}"
git pull

# 2. Rebuild backend
echo -e "${YELLOW}Step 2: Rebuilding backend (this may take a few minutes)...${NC}"
docker compose -f docker-compose.prod.prebuilt.yml build --no-cache backend

# 3. Stop services
echo -e "${YELLOW}Step 3: Stopping services...${NC}"
docker compose -f docker-compose.prod.prebuilt.yml stop backend frontend

# 4. Remove old containers to ensure clean restart
echo -e "${YELLOW}Step 4: Removing old containers...${NC}"
docker compose -f docker-compose.prod.prod.yml rm -f backend frontend 2>/dev/null || true

# 5. Start services
echo -e "${YELLOW}Step 5: Starting services...${NC}"
docker compose -f docker-compose.prod.prebuilt.yml up -d backend frontend

# 6. Wait for services to start
echo -e "${YELLOW}Step 6: Waiting for services to start...${NC}"
sleep 10

# 7. Check status
echo -e "${YELLOW}Step 7: Checking service status...${NC}"
docker compose -f docker-compose.prod.prebuilt.yml ps

# 8. Show backend logs
echo -e "${YELLOW}Step 8: Backend logs (last 20 lines):${NC}"
docker compose -f docker-compose.prod.prebuilt.yml logs backend --tail=20

# 9. Show frontend logs
echo -e "${YELLOW}Step 9: Frontend logs (last 10 lines):${NC}"
docker compose -f docker-compose.prod.prebuilt.yml logs frontend --tail=10

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "⚠️  IMPORTANT: Clear your browser cache or use incognito mode to see changes!"
echo ""
echo "To verify frontend is updated, check the JS file:"
echo "  curl -I http://3.68.134.145:3001/static/js/main.*.js | head -1"
echo ""
echo "To test user creation API:"
echo "  curl -X POST http://3.68.134.145:3000/api/users \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "    -d '{\"username\":\"test\",\"password\":\"test123\",\"name\":\"Test\",\"last_name\":\"User\",\"role\":\"technician\",\"language_preference\":\"ka\"}'"

