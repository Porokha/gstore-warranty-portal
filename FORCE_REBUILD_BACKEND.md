# Force Rebuild Backend to Apply Fixes

## The Problem

The backend container is still running old code even after `git pull`. This happens because:
- Docker uses cached layers
- The container needs to be rebuilt, not just restarted
- Old code is still in the container image

## Solution: Force Complete Rebuild

```bash
# 1. Stop everything
docker compose down

# 2. Remove old backend image (forces rebuild)
docker rmi gstore-warranty-portal-backend 2>/dev/null || true

# 3. Pull latest code
git pull

# 4. Rebuild backend with NO cache (forces fresh build)
docker compose build --no-cache backend

# 5. Start services
docker compose -f docker-compose.prod.prebuilt.yml up -d

# 6. Check logs
docker compose logs backend --tail=30
```

## Alternative: Quick Rebuild

```bash
# Stop and remove containers
docker compose down

# Rebuild without cache
docker compose build --no-cache backend

# Start
docker compose -f docker-compose.prod.prebuilt.yml up -d
```

## Verify the Fix is Applied

```bash
# Check if backend is running
docker compose ps

# Check logs for errors
docker compose logs backend --tail=20 | grep -i error

# Test the endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/cases
```

## Why This Happens

- `docker compose restart` - Only restarts, doesn't rebuild
- `docker compose build` - May use cached layers
- `docker compose build --no-cache` - Forces complete rebuild

You need `--no-cache` to ensure the new code is actually used.

