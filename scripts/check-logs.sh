#!/bin/bash

# Quick script to check container logs
# Usage: ./scripts/check-logs.sh [service_name]

SERVICE=${1:-backend}

echo "📋 Checking logs for: $SERVICE"
echo ""

docker-compose -f docker-compose.prod.yml logs --tail=50 $SERVICE

