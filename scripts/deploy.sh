#!/bin/bash

# Gstore Warranty Portal - Deployment Script
# This script helps deploy the application on AWS Lightsail

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ Error: backend/.env file not found!${NC}"
    echo "Please copy backend/.env.example to backend/.env and configure it."
    exit 1
fi

if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}⚠️  Warning: frontend/.env file not found!${NC}"
    echo "Creating from example..."
    cp frontend/.env.example frontend/.env
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed!${NC}"
    echo "Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed!${NC}"
    echo "Please install Docker Compose first."
    exit 1
fi

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose -f docker-compose.prod.yml down || true

# Build and start containers
echo -e "${GREEN}🔨 Building and starting containers...${NC}"
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for database to be ready
echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"
sleep 10

# Check if containers are running
echo -e "${GREEN}✅ Checking container status...${NC}"
docker-compose -f docker-compose.prod.yml ps

# Show logs
echo -e "${GREEN}📋 Recent logs:${NC}"
docker-compose -f docker-compose.prod.yml logs --tail=50

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "🌐 Access your application:"
echo "   Frontend: http://YOUR_IP:3001"
echo "   Backend API: http://YOUR_IP:3000/api"
echo "   API Docs: http://YOUR_IP:3000/api/docs"
echo ""
echo "📝 Next steps:"
echo "   1. Create initial admin user (see docs/AWS_LIGHTSAIL_DEPLOYMENT.md)"
echo "   2. Run database migrations if needed"
echo "   3. Configure firewall ports in Lightsail"
echo ""
echo "📊 View logs: docker-compose -f docker-compose.prod.yml logs -f"

