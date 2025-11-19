# Backend Container Restart Fix

## Issue
Backend container keeps restarting with exit code 1.

## Common Causes

### 1. Database Connection Failed
The backend can't connect to the database. This is the most common issue.

**Check:**
```bash
# View backend logs
docker-compose -f docker-compose.prod.yml logs backend

# Check if database is ready
docker-compose -f docker-compose.prod.yml ps db
```

**Fix:**
- Wait 30-60 seconds after starting database
- Verify `DB_PASSWORD` in `backend/.env` matches `MYSQL_PASSWORD` in docker-compose
- Check database is healthy: `docker-compose -f docker-compose.prod.yml ps db` should show "healthy"

### 2. Build Failed
TypeScript compilation failed.

**Check:**
```bash
# Try building manually
docker-compose -f docker-compose.prod.yml exec backend sh
npm run build
```

**Fix:**
- Updated Dockerfile to use multi-stage build
- Now installs dev dependencies for building, then only production for runtime

### 3. Missing Environment Variables
Required env vars not set.

**Check:**
```bash
# Verify .env file exists
ls -la backend/.env

# Check key variables
cat backend/.env | grep -E "(DB_|JWT_)"
```

**Required variables:**
- `DB_HOST=db`
- `DB_PORT=3306`
- `DB_NAME=gstore_warranty`
- `DB_USER=gstore`
- `DB_PASSWORD=your_password`
- `JWT_SECRET=your_secret`

### 4. Port Already in Use
Port 3000 already occupied.

**Check:**
```bash
sudo netstat -tulpn | grep :3000
```

**Fix:**
- Change port in docker-compose.prod.yml or kill the process

## Quick Fix Steps

1. **Check logs:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs --tail=100 backend
   ```

2. **Restart everything:**
   ```bash
   docker-compose -f docker-compose.prod.yml down
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Wait for database:**
   ```bash
   # Wait 30 seconds
   sleep 30
   
   # Check database is healthy
   docker-compose -f docker-compose.prod.yml ps db
   ```

4. **Check backend again:**
   ```bash
   docker-compose -f docker-compose.prod.yml ps backend
   docker-compose -f docker-compose.prod.yml logs --tail=50 backend
   ```

## Updated Dockerfile

The Dockerfile has been updated to:
- Use multi-stage build
- Install dev dependencies for building
- Only include production dependencies in final image
- Properly build TypeScript code

This should fix build-related restart issues.

