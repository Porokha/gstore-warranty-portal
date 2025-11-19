#!/bin/bash

# Script to diagnose and fix backend restart issues

set -e

echo "🔍 Diagnosing backend restart issue..."
echo ""

# Check backend logs
echo "📋 Backend logs (last 50 lines):"
echo "----------------------------------------"
docker-compose -f docker-compose.prod.yml logs --tail=50 backend
echo ""

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "❌ ERROR: backend/.env file not found!"
    echo "Please create it from backend/.env.example"
    exit 1
fi

# Check database connection
echo "🔍 Checking database connection..."
DB_PASSWORD=$(grep "^DB_PASSWORD=" backend/.env | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)

if [ -z "$DB_PASSWORD" ]; then
    echo "⚠️  WARNING: DB_PASSWORD not set in backend/.env"
else
    echo "✅ DB_PASSWORD is set"
fi

# Check if database is healthy
echo ""
echo "🔍 Checking database status..."
docker-compose -f docker-compose.prod.yml ps db

# Check backend container status
echo ""
echo "🔍 Backend container status:"
docker-compose -f docker-compose.prod.yml ps backend

echo ""
echo "💡 Common fixes:"
echo "1. Wait for database to be fully ready (30 seconds after start)"
echo "2. Check backend/.env has correct DB_PASSWORD"
echo "3. Verify JWT_SECRET is set"
echo "4. Restart backend: docker-compose -f docker-compose.prod.yml restart backend"
echo ""
echo "📝 To see real-time logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f backend"

