# After Pulling Changes - Checklist

## ✅ Quick Check Commands

### 1. See What Changed
```bash
# View recent commits
git log --oneline -10

# See files that changed
git diff HEAD~5 HEAD --stat

# See actual code changes in last commit
git show HEAD
```

### 2. Check if Dependencies Changed
```bash
# Check backend dependencies
git diff HEAD~1 HEAD -- backend/package.json

# Check frontend dependencies  
git diff HEAD~1 HEAD -- frontend/package.json
```

## 🔄 If Running Locally (Development)

### If package.json changed:
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### Restart services:
```bash
# Backend (in backend directory)
npm run start:dev

# Frontend (in frontend directory)
npm start
```

## 🐳 If Running with Docker

### If package.json or Dockerfile changed:
```bash
# Rebuild containers
docker compose build

# Or rebuild specific service
docker compose build backend
docker compose build frontend
```

### Restart services:
```bash
# Restart all
docker compose restart

# Or restart specific service
docker compose restart backend
docker compose restart frontend

# Or use up command (rebuilds if needed)
docker compose up -d
```

## 📊 Check What's New

### Recent Major Changes:
1. **SLA Monitoring** - New scheduled job that checks cases hourly
2. **SMS Settings UI** - Admin can now control SMS notifications
3. **BOG Payment Gateway** - Payment integration added
4. **Project Completion Summary** - New documentation file

### New Files to Review:
- `PROJECT_COMPLETION_SUMMARY.md` - Overview of all features
- `docs/GIT_COMMANDS.md` - Git command reference
- `backend/src/sla/` - SLA monitoring service
- `frontend/src/services/slaService.js` - Frontend SLA service

## 🔍 Verify Everything Works

### Check Backend:
```bash
# If running locally
curl http://localhost:3000/api/dashboard/stats

# If running in Docker
curl http://localhost:3000/api/dashboard/stats
```

### Check Frontend:
- Open http://localhost:3001
- Login and check dashboard
- Check Settings page (admin only) for SMS controls

## 📝 Database Changes

If new entities were added, you may need to:
```bash
# Run migrations (if using TypeORM migrations)
npm run migration:run

# Or restart the backend (it will sync schema automatically in dev mode)
```

## 🚨 Common Issues After Pull

### Issue: "Module not found" errors
**Solution:** Run `npm install` in the affected directory

### Issue: Docker containers won't start
**Solution:** 
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Issue: Database connection errors
**Solution:** Check `.env` file and restart database container

## 📚 Documentation Updates

New documentation files:
- `PROJECT_COMPLETION_SUMMARY.md` - Complete feature list
- `docs/GIT_COMMANDS.md` - Git command reference
- `docs/WOOCOMMERCE_SETUP.md` - WooCommerce integration guide
- `docs/WOOCOMMERCE_CREDENTIALS_SETUP.md` - Credentials setup

## ✨ What's New in Latest Commits

1. **SLA Monitoring** (`bb2aac4`)
   - Hourly cron job checks cases
   - Sends SMS alerts for due/stalled cases
   - New `/api/sla/metrics` endpoint

2. **SMS Settings** (`0c3255b`)
   - Admin UI to control SMS notifications
   - Per-event toggles
   - Global enable/disable

3. **BOG Payment Gateway** (`70373ec`)
   - Payment initiation
   - Callback handling
   - Status checking

4. **Project Summary** (`02cd334`)
   - Complete feature documentation
   - Configuration guide
   - Optional enhancements list

