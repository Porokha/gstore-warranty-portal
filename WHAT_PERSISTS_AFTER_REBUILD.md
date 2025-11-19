# What Persists After Rebuild

## ✅ What STAYS (No Re-setup Needed)

### 1. **Database & All Data** ✅
- All warranty records
- All service cases
- All users (including admin)
- All payments
- All files
- All settings

**Why?** Database uses a **persistent volume** (`db_data`)

### 2. **Environment Variables** ✅
- WooCommerce keys
- BOG payment gateway keys
- SMS API keys
- JWT secret
- Database credentials

**Why?** Stored in `backend/.env` file (mounted as volume)

### 3. **Uploaded Files** ✅
- All case files
- All uploaded documents

**Why?** Stored in `backend/uploads/` (mounted as volume)

### 4. **Admin Users** ✅
- All user accounts
- All passwords
- All roles

**Why?** Stored in database (persistent)

## ❌ What Gets RESET

### 1. **Frontend Build** (if rebuilding frontend)
- React app bundle
- Static files

**Solution:** Just rebuild, no setup needed

### 2. **Backend Code** (if rebuilding backend)
- Node.js application code
- Dependencies

**Solution:** Just rebuild, no setup needed

## 🔄 Rebuild Scenarios

### Scenario 1: Rebuild Frontend Only
```bash
docker compose build frontend
docker compose restart frontend
```

**Result:** 
- ✅ Everything stays
- ✅ No re-setup needed
- ✅ Just new frontend code

### Scenario 2: Rebuild Backend Only
```bash
docker compose build backend
docker compose restart backend
```

**Result:**
- ✅ Database stays
- ✅ Admin users stay
- ✅ Environment variables stay
- ✅ Uploaded files stay
- ✅ No re-setup needed

### Scenario 3: Rebuild Both
```bash
docker compose build
docker compose restart
```

**Result:**
- ✅ Everything stays
- ✅ No re-setup needed

### Scenario 4: Complete Reset (⚠️ DANGER)
```bash
docker compose down -v  # -v removes volumes!
docker compose up -d
```

**Result:**
- ❌ **Database DELETED** - Need to recreate
- ❌ **Admin users DELETED** - Need to recreate
- ❌ **All data DELETED** - Need to re-import
- ✅ Environment variables stay (in .env file)
- ⚠️ **NEEDS FULL RE-SETUP**

## 📋 Quick Checklist

After rebuild, check:

```bash
# 1. Check if database is running
docker compose ps db

# 2. Check if you can login (admin still exists)
# Try logging in at http://your-server:3001/staff/login

# 3. Check if data is there
# Check dashboard - should show existing cases/warranties

# 4. Check environment variables
cat backend/.env | grep WOOCOMMERCE
```

## 🚨 When You DO Need Re-setup

Only if you:

1. **Removed volumes** (`docker compose down -v`)
2. **Deleted database volume** (`docker volume rm gstore-warranty-db_data`)
3. **Formatted the server**
4. **Started fresh on new server**

## ✅ Normal Rebuild Process

```bash
# 1. Cleanup (optional)
./cleanup-before-build.sh

# 2. Rebuild
docker compose build frontend

# 3. Restart
docker compose restart frontend

# 4. Verify (no setup needed!)
# - Login still works
# - Data still there
# - Settings still there
```

## 💾 What's Stored Where

| Item | Location | Persists? |
|------|----------|-----------|
| Database | `db_data` volume | ✅ Yes |
| Admin users | Database | ✅ Yes |
| WooCommerce keys | `backend/.env` | ✅ Yes |
| BOG keys | `backend/.env` | ✅ Yes |
| SMS keys | `backend/.env` | ✅ Yes |
| Uploaded files | `backend/uploads/` | ✅ Yes |
| Frontend build | Container image | ❌ Rebuilt |
| Backend code | Container image | ❌ Rebuilt |

## 🎯 Bottom Line

**You DON'T need to redo setup after rebuild** unless you:
- Removed volumes (`-v` flag)
- Deleted the database
- Started on a completely new server

Just rebuild and restart - everything else stays! 🎉

