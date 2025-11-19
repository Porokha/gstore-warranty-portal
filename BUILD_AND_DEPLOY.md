# Build Locally and Deploy via GitHub

## Workflow

1. Build frontend locally
2. Commit build folder to GitHub
3. Pull on server and use pre-built files

## Step-by-Step Guide

### Step 1: Build Locally

On your local machine:

```bash
# Navigate to frontend
cd frontend

# Install dependencies (if needed)
npm install

# Build production bundle
npm run build

# This creates a 'build' folder with optimized files
```

### Step 2: Commit Build to GitHub

```bash
# Go back to project root
cd ..

# Add build folder (use -f to force add even if in .gitignore)
git add -f frontend/build

# Commit
git commit -m "Update production build - $(date +%Y-%m-%d)"

# Push to GitHub
git push
```

**Or use the automated script:**
```bash
./build-and-push.sh
```

### Step 3: On Server - Pull and Deploy

On your Lightsail server:

```bash
# Pull latest changes (including build folder)
git pull

# Stop current services
docker compose down

# Use pre-built compose file (no build step needed)
docker compose -f docker-compose.prod.prebuilt.yml up -d

# Check logs
docker compose logs frontend
```

## Automated Script

Create `build-and-push.sh` on your local machine:

```bash
#!/bin/bash

echo "🔨 Building frontend..."
cd frontend
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

cd ..

echo "📦 Committing build to Git..."
git add frontend/build
git commit -m "Update production build - $(date +%Y-%m-%d)"

echo "🚀 Pushing to GitHub..."
git push

echo "✅ Done! Now pull on server and restart services."
```

Make it executable:
```bash
chmod +x build-and-push.sh
```

Then just run:
```bash
./build-and-push.sh
```

## Important Notes

### ⚠️ Build Folder Size

The build folder is typically large (5-10MB). If you want to avoid committing it every time:

**Option A: Only commit when needed**
- Only commit build folder when you make frontend changes
- Use `.gitignore` to exclude it normally

**Option B: Use a separate branch**
- Create a `deploy` branch for builds
- Merge to main when deploying

**Option C: Use GitHub Releases**
- Create a release with build artifacts
- Download on server

## Update .gitignore (Optional)

If you want to commit builds but ignore other files:

```gitignore
# Keep build folder in repo for deployment
# frontend/build

# But ignore other build artifacts
frontend/node_modules
frontend/.env.local
```

## Quick Deploy Workflow

```bash
# Local machine
cd frontend && npm run build && cd ..
git add frontend/build && git commit -m "Deploy frontend build" && git push

# Server
git pull && docker compose -f docker-compose.prod.prebuilt.yml up -d
```

## Benefits

✅ **No Docker build issues** - Build on your powerful machine  
✅ **Version control** - Build is tracked in Git  
✅ **Easy rollback** - Can revert to previous build  
✅ **Faster deployment** - Just pull and restart  

