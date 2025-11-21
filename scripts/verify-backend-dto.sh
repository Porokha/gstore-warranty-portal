#!/bin/bash
# Script to verify backend DTO includes new fields
# Usage: ./scripts/verify-backend-dto.sh

echo "Checking if backend container has new DTO fields..."

# Check if container is running
if ! docker compose -f docker-compose.prod.prebuilt.yml ps backend | grep -q "Up"; then
    echo "❌ Backend container is not running!"
    exit 1
fi

# Check if the DTO file in container has the new fields
echo "Checking DTO in backend container..."
docker compose -f docker-compose.prod.prebuilt.yml exec backend grep -q "customer_last_name" /app/dist/cases/dto/create-case.dto.js 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ customer_last_name found in compiled DTO"
else
    echo "❌ customer_last_name NOT found in compiled DTO - backend needs rebuild!"
fi

docker compose -f docker-compose.prod.prebuilt.yml exec backend grep -q "customer_initial_note" /app/dist/cases/dto/create-case.dto.js 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ customer_initial_note found in compiled DTO"
else
    echo "❌ customer_initial_note NOT found in compiled DTO - backend needs rebuild!"
fi

echo ""
echo "If fields are missing, run:"
echo "  docker compose -f docker-compose.prod.prebuilt.yml build --no-cache backend"
echo "  docker compose -f docker-compose.prod.prebuilt.yml restart backend"

