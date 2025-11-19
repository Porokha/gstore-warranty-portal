# Quick Diagnostic - Service Not Accessible

## Check What's Running

```bash
# Check if containers are running
docker compose ps

# Check all containers (including stopped)
docker ps -a

# Check frontend specifically
docker ps | grep frontend

# Check backend specifically
docker ps | grep backend
```

## Check Logs

```bash
# Frontend logs
docker compose logs frontend --tail=50

# Backend logs
docker compose logs backend --tail=50

# All logs
docker compose logs --tail=50
```

## Check Ports

```bash
# Check if ports are listening
netstat -tuln | grep -E '3000|3001'
# Or
ss -tuln | grep -E '3000|3001'
```

## Common Issues

### Issue 1: Containers Stopped
```bash
# Start all services
docker compose -f docker-compose.prod.prebuilt.yml up -d

# Or if using regular compose
docker compose up -d
```

### Issue 2: Build Folder Missing
```bash
# Check if build folder exists
ls -la frontend/build

# If missing, pull from git
git pull
```

### Issue 3: Port Already in Use
```bash
# Check what's using the ports
sudo lsof -i :3000
sudo lsof -i :3001

# Stop conflicting services
```

### Issue 4: Network Issues
```bash
# Check if containers can communicate
docker compose exec backend ping db
docker compose exec frontend ping backend
```

## Quick Fix Commands

```bash
# 1. Stop everything
docker compose down

# 2. Pull latest
git pull

# 3. Start with pre-built compose
docker compose -f docker-compose.prod.prebuilt.yml up -d

# 4. Check status
docker compose ps

# 5. Check logs
docker compose logs --tail=20
```

## Test Access

```bash
# Test backend
curl http://localhost:3000/api/health
curl http://3.68.134.145:3000/api/health

# Test frontend
curl http://localhost:3001
curl http://3.68.134.145:3001
```

