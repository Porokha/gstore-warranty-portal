# Quick Fix: ERR_CONNECTION_REFUSED

## Problem
Frontend is trying to connect to `localhost:3000` instead of server IP `3.68.134.145:3000`.

## Solution

### Step 1: Verify Backend is Running on Server

```bash
# SSH to your server
ssh ubuntu@3.68.134.145

# Check if backend container is running
docker compose ps

# If not running, start it
cd ~/gstore-warranty-portal
docker compose -f docker-compose.prod.prebuilt.yml up -d backend

# Check backend logs
docker compose logs backend --tail=30

# Test backend directly
curl http://localhost:3000/api/health
```

### Step 2: Verify Backend is Accessible from Outside

```bash
# On server, check if port 3000 is listening
sudo netstat -tlnp | grep 3000

# Or
sudo ss -tlnp | grep 3000

# Check firewall (if any)
sudo ufw status
```

### Step 3: If Backend is Running but Not Accessible

The backend might be binding to `localhost` instead of `0.0.0.0`. Check:

```bash
# In backend/.env or docker-compose, ensure:
# Backend should listen on 0.0.0.0:3000 (not localhost:3000)
```

### Step 4: Rebuild Frontend with Correct URL (if needed)

The build should already have the correct URL, but if needed:

```bash
# On your local machine
cd /Users/gstore/platform-project
./build-and-push.sh
```

### Step 5: On Server - Pull and Restart

```bash
# On server
cd ~/gstore-warranty-portal
git pull

# Restart frontend to use new build
docker compose -f docker-compose.prod.prebuilt.yml restart frontend

# Check frontend logs
docker compose logs frontend --tail=20
```

## Common Issues

1. **Backend not running**: Start with `docker compose up -d backend`
2. **Backend crashed**: Check logs with `docker compose logs backend`
3. **Port not exposed**: Verify `ports: - "3000:3000"` in docker-compose
4. **Firewall blocking**: Check AWS Lightsail firewall rules
5. **Wrong URL in build**: Rebuild frontend with correct `REACT_APP_API_URL`

## Verify Fix

1. Open browser: `http://3.68.134.145:3001/staff/login`
2. Open browser DevTools (F12) → Network tab
3. Try to login
4. Check if requests go to `http://3.68.134.145:3000/api/auth/login` (not localhost)

