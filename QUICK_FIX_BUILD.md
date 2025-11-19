# Quick Fix for Stuck Build

## If build is stuck for 30+ minutes:

### Step 1: Cancel and Check
```bash
# Stop everything
docker compose down

# Check disk space (might be full)
df -h

# Check if there are old containers/images taking space
docker system df
```

### Step 2: Clean Up
```bash
# Remove old/unused images
docker system prune -a

# Remove old frontend images
docker rmi $(docker images | grep frontend | awk '{print $3}') 2>/dev/null || true
```

### Step 3: Rebuild with Timeout
```bash
# Set a timeout and rebuild
timeout 600 docker compose build frontend --progress=plain --no-cache
```

### Step 4: If Still Failing - Use Optimized Dockerfile
```bash
# Backup current Dockerfile
cp frontend/Dockerfile frontend/Dockerfile.backup

# Use optimized version
cp frontend/Dockerfile.optimized frontend/Dockerfile

# Rebuild
docker compose build frontend --no-cache
```

### Step 5: Check Logs During Build
```bash
# In one terminal, watch logs
docker compose logs -f frontend

# In another terminal, start build
docker compose build frontend --progress=plain
```

## Most Likely Causes:

1. **Network timeout** downloading npm packages
   - Solution: Use `--prefer-offline` flag

2. **Out of memory** during build
   - Solution: Add `NODE_OPTIONS="--max-old-space-size=2048"`

3. **Disk space full**
   - Solution: Clean up with `docker system prune`

4. **npm registry slow/unreachable**
   - Solution: Use npm cache or mirror

## Emergency Workaround:

If build keeps failing, you can:
1. Build locally on your machine
2. Copy the `build/` folder to server
3. Use a simple nginx container to serve it

```bash
# On your local machine
cd frontend
npm install
npm run build

# Copy to server
scp -r build/ user@your-server:/path/to/frontend/build

# On server, use simple nginx
docker run -d -p 3001:80 -v /path/to/frontend/build:/usr/share/nginx/html nginx:alpine
```

