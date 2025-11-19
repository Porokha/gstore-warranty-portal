# Frontend Troubleshooting

## Issue: Staff Login Page is Empty

### Possible Causes:

1. **JavaScript Errors in Browser Console**
   - Open browser developer tools (F12)
   - Check Console tab for errors
   - Check Network tab for failed API requests

2. **API Connection Failed**
   - Frontend can't reach backend API
   - Check `REACT_APP_API_URL` in frontend/.env
   - Should be: `http://3.68.134.145:3000/api`

3. **CORS Issues**
   - Backend CORS not configured for your IP
   - Check `FRONTEND_URL` in backend/.env
   - Should include your IP or be set to allow all

4. **React Router Issue**
   - Check browser console for routing errors
   - URL should be: `http://3.68.134.145:3001/staff/login`

## Issue: API Docs Not Reachable

### Check:

1. **Backend is Running**
   ```bash
   docker-compose -f docker-compose.prod.yml ps backend
   ```

2. **Backend Logs**
   ```bash
   docker-compose -f docker-compose.prod.yml logs --tail=50 backend
   ```

3. **Backend Health Endpoint**
   ```bash
   curl http://3.68.134.145:3000/api/health
   ```

4. **Firewall Rules**
   - Port 3000 must be open in Lightsail Networking
   - Source: Anywhere (0.0.0.0/0)

5. **CORS Configuration**
   - Backend must allow requests from frontend URL
   - Check backend/.env: `FRONTEND_URL=http://3.68.134.145:3001`

## Quick Fixes

### 1. Check Frontend Environment
```bash
cat frontend/.env
# Should have:
# REACT_APP_API_URL=http://3.68.134.145:3000/api
```

### 2. Check Backend Environment
```bash
cat backend/.env | grep FRONTEND_URL
# Should have:
# FRONTEND_URL=http://3.68.134.145:3001
```

### 3. Restart Services
```bash
docker-compose -f docker-compose.prod.yml restart backend frontend
```

### 4. Check Browser Console
- Open http://3.68.134.145:3001/staff/login
- Press F12 to open developer tools
- Check Console tab for errors
- Check Network tab for failed requests

