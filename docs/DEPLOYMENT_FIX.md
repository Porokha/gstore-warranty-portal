# Deployment Fix - Package Lock Files

## Issue
The Docker build was failing with:
```
npm error The `npm ci` command can only install with an existing package-lock.json
```

## Solution Applied
Updated both Dockerfiles to use `npm install` instead of `npm ci`. This is more flexible and works without requiring lock files.

## What Changed

### Backend Dockerfile
- Changed from `npm ci --only=production` to `npm install --only=production`
- Added `--no-audit --no-fund` flags to speed up installation

### Frontend Dockerfile  
- Changed from `npm ci` to `npm install`
- Added `--no-audit --no-fund` flags to speed up installation

## Why This Works
- `npm install` works without lock files
- Still installs all dependencies correctly
- Faster build process (skips audit and funding messages)
- More reliable for deployment scenarios

## Next Steps
You can now retry the deployment:

```bash
cd ~/gstore-warranty-portal
docker-compose -f docker-compose.prod.yml up -d --build
```

The build should now complete successfully!

## Optional: Generate Lock Files Later
If you want to use `npm ci` in the future for faster, more reliable builds:

```bash
# In backend directory
cd backend
npm install
# This creates package-lock.json

# In frontend directory  
cd frontend
npm install
# This creates package-lock.json
```

Then commit the lock files to your repository and update Dockerfiles back to use `npm ci`.

