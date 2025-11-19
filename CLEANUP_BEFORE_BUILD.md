# Cleanup Before Rebuilding Frontend

## Why Clean Up?

Docker can accumulate:
- Old/unused images
- Stopped containers
- Build cache
- Dangling volumes
- Temporary build files

This can cause:
- Disk space issues
- Build conflicts
- Slower builds

## Cleanup Commands

### Step 1: Check Current Disk Usage

```bash
# Check overall disk space
df -h

# Check Docker disk usage
docker system df

# Check what's taking space
du -sh /var/lib/docker/* 2>/dev/null | sort -h
```

### Step 2: Stop Running Containers

```bash
# Stop all containers
docker compose down

# Or stop specific service
docker compose stop frontend
```

### Step 3: Clean Up Docker System

```bash
# Remove all stopped containers
docker container prune -f

# Remove unused images (be careful - removes ALL unused images)
docker image prune -a -f

# Remove build cache
docker builder prune -a -f

# Or do everything at once (RECOMMENDED)
docker system prune -a -f

# This removes:
# - All stopped containers
# - All networks not used by at least one container
# - All images without at least one container associated
# - All build cache
```

### Step 4: Remove Old Frontend Images Specifically

```bash
# List frontend images
docker images | grep frontend

# Remove specific frontend image
docker rmi $(docker images | grep 'gstore-warranty-frontend' | awk '{print $3}') 2>/dev/null || true

# Or remove all frontend-related images
docker images | grep -E 'frontend|gstore' | awk '{print $3}' | xargs docker rmi 2>/dev/null || true
```

### Step 5: Clean Up Build Artifacts

```bash
# Remove old build folders (if any)
rm -rf frontend/build.old 2>/dev/null || true

# Remove node_modules if rebuilding (optional)
# rm -rf frontend/node_modules 2>/dev/null || true
```

### Step 6: Clean Up Docker Volumes (Optional - Be Careful!)

```bash
# List volumes
docker volume ls

# Remove unused volumes (WARNING: This removes data!)
docker volume prune -f
```

## Complete Cleanup Script

Create `cleanup-before-build.sh`:

```bash
#!/bin/bash

echo "🧹 Cleaning up before build..."

# Stop containers
echo "⏹️  Stopping containers..."
docker compose down

# Clean Docker system
echo "🗑️  Cleaning Docker system..."
docker system prune -a -f

# Remove frontend images
echo "🗑️  Removing old frontend images..."
docker images | grep -E 'frontend|gstore.*frontend' | awk '{print $3}' | xargs docker rmi 2>/dev/null || true

# Clean build cache
echo "🗑️  Cleaning build cache..."
docker builder prune -a -f

# Show disk usage
echo ""
echo "📊 Current disk usage:"
df -h | grep -E 'Filesystem|/dev/'

echo ""
echo "📦 Docker disk usage:"
docker system df

echo ""
echo "✅ Cleanup complete!"
```

Make it executable:
```bash
chmod +x cleanup-before-build.sh
```

## Safe Cleanup (Recommended)

If you want to be more careful:

```bash
# 1. Stop containers
docker compose down

# 2. Remove only stopped containers
docker container prune -f

# 3. Remove only dangling images (not used by any container)
docker image prune -f

# 4. Remove build cache older than 24 hours
docker builder prune --filter "until=24h" -f

# 5. Remove old frontend images
docker images | grep 'gstore-warranty-frontend' | awk '{print $3}' | xargs docker rmi 2>/dev/null || true
```

## Check What Will Be Removed (Dry Run)

```bash
# See what would be removed (without actually removing)
docker system df
docker images
docker ps -a
```

## After Cleanup - Rebuild

```bash
# Now rebuild with clean slate
docker compose build frontend --no-cache --progress=plain
```

## Disk Space Requirements

Make sure you have at least:
- **2GB free** for Docker build process
- **500MB free** for final image
- **1GB free** for build cache (if keeping it)

## Quick Check Before Build

```bash
# Quick check script
echo "Disk space:"
df -h | head -2

echo ""
echo "Docker usage:"
docker system df

echo ""
echo "Frontend images:"
docker images | grep frontend || echo "No frontend images found"
```

