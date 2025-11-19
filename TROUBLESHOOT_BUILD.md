# Troubleshooting Long Build Times

## 1872 seconds (31 minutes) is NOT normal!

A React frontend build should take **1-5 minutes** at most.

## Immediate Actions

### 1. Check if build is actually running
```bash
# Check Docker processes
docker ps -a

# Check if build process is still active
ps aux | grep docker
```

### 2. Check build logs
```bash
# See what's happening in the build
docker compose logs frontend --tail=100

# Or if building directly
docker compose build frontend --progress=plain --no-cache 2>&1 | tee build.log
```

### 3. Cancel and restart with better visibility
```bash
# Cancel current build (Ctrl+C if running in terminal)
# Or stop the container
docker compose stop frontend

# Rebuild with verbose output
docker compose build frontend --progress=plain --no-cache
```

## Common Issues

### Issue 1: Build is stuck downloading dependencies
**Solution:** Check network connectivity
```bash
# Test if npm registry is accessible
docker run --rm node:18-alpine npm ping
```

### Issue 2: Out of disk space
**Solution:** Check disk space
```bash
df -h
docker system df
```

### Issue 3: Out of memory
**Solution:** Check memory
```bash
free -h
docker stats
```

### Issue 4: Build cache issues
**Solution:** Clear cache and rebuild
```bash
docker compose build frontend --no-cache --pull
```

## Quick Fix: Rebuild with No Cache

```bash
# Stop everything
docker compose down

# Remove old images
docker rmi $(docker images -q gstore-warranty-frontend) 2>/dev/null || true

# Rebuild with no cache
docker compose build frontend --no-cache --progress=plain

# Start services
docker compose up -d
```

## Alternative: Build Locally and Copy

If Docker build keeps failing, you can:
1. Build locally
2. Copy the build folder to server
3. Use a simpler Dockerfile that just serves static files

