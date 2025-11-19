# Build Frontend Locally and Copy to Server

## Why This Works Better

React builds are memory-intensive. If your Lightsail instance has limited RAM, building locally and copying is much faster and more reliable.

## Step-by-Step Guide

### Step 1: Build on Your Local Machine

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already done)
npm install

# Build the production bundle
npm run build

# This creates a 'build' folder with optimized files
```

### Step 2: Copy Build Folder to Server

```bash
# From your local machine, copy the build folder to server
# Replace with your actual server details:
scp -r build/* user@your-server-ip:/path/to/project/frontend/build/

# Or if build folder doesn't exist on server yet:
scp -r build user@your-server-ip:/path/to/project/frontend/
```

### Step 3: On Server - Use Simple Nginx Container

Instead of building in Docker, serve the pre-built files:

```bash
# Option A: Update docker-compose to use volume mount
# Edit docker-compose.prod.yml frontend service:

frontend:
  image: nginx:alpine
  container_name: gstore-warranty-frontend
  ports:
    - "3001:80"
  volumes:
    - ./frontend/build:/usr/share/nginx/html:ro
    - ./frontend/nginx.conf:/etc/nginx/conf.d/default.conf:ro
  networks:
    - gstore-network
  restart: unless-stopped

# Then just start it:
docker compose up -d frontend
```

### Step 4: Alternative - Manual Nginx Container

```bash
# On server, create nginx container manually
docker run -d \
  --name gstore-frontend \
  -p 3001:80 \
  -v /path/to/project/frontend/build:/usr/share/nginx/html:ro \
  -v /path/to/project/frontend/nginx.conf:/etc/nginx/conf.d/default.conf:ro \
  --network gstore-network \
  --restart unless-stopped \
  nginx:alpine
```

## Quick Script for Local Build

Create `build-and-deploy.sh` on your local machine:

```bash
#!/bin/bash

# Build frontend
cd frontend
npm run build

# Copy to server (update with your details)
echo "Copying build to server..."
scp -r build/* user@your-server:/path/to/project/frontend/build/

echo "Done! Restart frontend container on server:"
echo "docker compose restart frontend"
```

Make it executable:
```bash
chmod +x build-and-deploy.sh
```

## Advantages

✅ **Faster**: Build on your powerful local machine  
✅ **More Reliable**: No memory issues  
✅ **Easier Debugging**: See build errors immediately  
✅ **No Docker Build Time**: Just copy files and restart  

## When to Use This

- Docker build keeps failing/hanging
- Server has limited RAM (< 2GB)
- You want faster deployments
- You're making frequent frontend changes

## Updating Frontend

Every time you change frontend code:

1. Build locally: `cd frontend && npm run build`
2. Copy to server: `scp -r build/* user@server:/path/to/frontend/build/`
3. Restart container: `docker compose restart frontend`

Or use the script above to automate it!

