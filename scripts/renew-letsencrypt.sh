#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

docker run --rm \
  -v "$ROOT_DIR/deploy/letsencrypt:/etc/letsencrypt" \
  -v "$ROOT_DIR/deploy/certbot-www:/var/www/certbot" \
  certbot/certbot renew --webroot -w /var/www/certbot

docker compose -f docker-compose.prod.prebuilt.yml restart frontend
