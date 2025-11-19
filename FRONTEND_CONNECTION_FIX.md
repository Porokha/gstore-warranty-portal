# Fix: Frontend Connection Refused Error

## The Error

```
localhost:3000/api/auth/login:1 Failed to load resource: net::ERR_CONNECTION_REFUSED
```

## What This Means

The frontend is trying to connect to `http://localhost:3000/api` but:
- Backend is not running, OR
- Backend is running on a different port, OR
- Backend is running on a different host (if on server)

## Solutions

### Solution 1: Start Backend (If Running Locally)

If you're running frontend locally with `npm start`, you need to start the backend too:

```bash
# Terminal 1: Start backend
cd backend
npm install
npm run start:dev

# Terminal 2: Start frontend
cd frontend
npm install
npm start
```

### Solution 2: Configure Correct API URL

#### For Local Development

Create `frontend/.env.development`:
```env
REACT_APP_API_URL=http://localhost:3000/api
```

#### For Production/Server

The API URL should be set when building:

```bash
# Build with correct API URL
REACT_APP_API_URL=http://your-server-ip:3000/api npm run build
```

Or in `docker-compose.prod.yml`, it's set via build args:
```yaml
frontend:
  build:
    args:
      REACT_APP_API_URL: ${REACT_APP_API_URL:-http://localhost:3000/api}
```

### Solution 3: Check Backend is Running

```bash
# Check if backend is running
curl http://localhost:3000/api/health

# Or check Docker containers
docker compose ps

# Check backend logs
docker compose logs backend
```

### Solution 4: If Backend is on Different Host

If backend is on a server (e.g., `3.68.134.145:3000`):

**For local development:**
```env
# frontend/.env.development
REACT_APP_API_URL=http://3.68.134.145:3000/api
```

**For production build:**
```bash
REACT_APP_API_URL=http://3.68.134.145:3000/api npm run build
```

## Quick Fix Checklist

1. ✅ **Is backend running?**
   ```bash
   # Check backend
   curl http://localhost:3000/api/health
   # Should return: {"status":"ok"}
   ```

2. ✅ **Is API URL correct?**
   - Local: `http://localhost:3000/api`
   - Server: `http://your-server-ip:3000/api`

3. ✅ **Restart frontend after changing .env**
   ```bash
   # Stop frontend (Ctrl+C)
   # Start again
   npm start
   ```

4. ✅ **Check browser console**
   - Open DevTools (F12)
   - Check Network tab
   - See what URL it's trying to connect to

## Common Scenarios

### Scenario 1: Running Locally
```bash
# Terminal 1
cd backend && npm run start:dev

# Terminal 2  
cd frontend && npm start
```
API URL: `http://localhost:3000/api` ✅

### Scenario 2: Frontend Local, Backend on Server
```env
# frontend/.env.development
REACT_APP_API_URL=http://3.68.134.145:3000/api
```
Then restart frontend.

### Scenario 3: Both on Server (Docker)
```yaml
# docker-compose.prod.yml
REACT_APP_API_URL: http://backend:3000/api  # Internal Docker network
# OR
REACT_APP_API_URL: http://3.68.134.145:3000/api  # External access
```

## Testing Connection

```bash
# Test backend directly
curl http://localhost:3000/api/health

# Test from browser console
fetch('http://localhost:3000/api/health')
  .then(r => r.json())
  .then(console.log)
```

## Fixed Issues

1. ✅ Added `autoComplete` attributes to login form (fixes DOM warning)
2. ✅ Created `.env.development` file for local development
3. ✅ Documented connection troubleshooting

