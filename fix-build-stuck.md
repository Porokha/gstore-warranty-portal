# Fix: Build Stuck at "Creating an optimized production build"

## The Problem
React build is stuck at step 13, which means it's running out of memory or taking too long.

## Solution 1: Cancel and Rebuild with Memory Limit (RECOMMENDED)

### Step 1: Cancel Current Build
```bash
# Press Ctrl+C to cancel
# Or in another terminal:
docker compose down
```

### Step 2: Use Updated Dockerfile
I've updated the Dockerfile to:
- Add memory limit: `NODE_OPTIONS="--max-old-space-size=2048"`
- Disable source maps: `GENERATE_SOURCEMAP=false` (saves memory)

### Step 3: Rebuild
```bash
# Pull the updated Dockerfile
git pull

# Rebuild with no cache
docker compose build frontend --no-cache --progress=plain
```

## Solution 2: Build with More Memory (If Available)

If your Lightsail instance has more memory, increase the limit:

```bash
# Edit Dockerfile and change:
ENV NODE_OPTIONS="--max-old-space-size=4096"  # Use 4GB instead of 2GB
```

## Solution 3: Build Locally and Copy (FASTEST)

If Docker build keeps failing, build on your local machine:

### On Your Local Machine:
```bash
cd frontend
npm install
npm run build
```

### Copy to Server:
```bash
# Create build directory on server
ssh user@your-server "mkdir -p /path/to/project/frontend/build"

# Copy build folder
scp -r build/* user@your-server:/path/to/project/frontend/build/
```

### On Server, Use Simple Nginx:
```bash
# Update docker-compose.prod.yml to use pre-built files
# Or create a simple nginx container:
docker run -d \
  --name gstore-frontend \
  -p 3001:80 \
  -v /path/to/project/frontend/build:/usr/share/nginx/html:ro \
  nginx:alpine
```

## Solution 4: Optimize Build Process

Add to `frontend/.env.production`:
```
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
```

## What I Changed

1. **Dockerfile**: Added `NODE_OPTIONS="--max-old-space-size=2048"` before build
2. **package.json**: Changed build script to disable source maps (saves ~50% memory)

## After Rebuild

```bash
# Start services
docker compose up -d

# Check logs
docker compose logs frontend

# Verify it's running
curl http://localhost:3001
```

