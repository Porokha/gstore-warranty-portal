# Troubleshooting Guide

Common issues and solutions when deploying on AWS Lightsail.

## 🔴 Container Issues

### Containers Won't Start

**Symptoms:** Containers exit immediately or show "Exited" status

**Solutions:**
```bash
# Check logs for errors
docker-compose -f docker-compose.prod.yml logs

# Check specific service
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs db

# Rebuild containers
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

**Common causes:**
- Environment variables missing or incorrect
- Port already in use
- Database connection failed
- Out of memory

### Database Connection Failed

**Symptoms:** Backend logs show "ECONNREFUSED" or "Connection refused"

**Solutions:**
```bash
# Check if database is running
docker-compose -f docker-compose.prod.yml ps db

# Check database logs
docker-compose -f docker-compose.prod.yml logs db

# Verify database password in .env matches docker-compose
cat backend/.env | grep DB_PASSWORD

# Restart database
docker-compose -f docker-compose.prod.yml restart db

# Wait 30 seconds, then restart backend
sleep 30
docker-compose -f docker-compose.prod.yml restart backend
```

### Port Already in Use

**Symptoms:** Error: "port is already allocated" or "address already in use"

**Solutions:**
```bash
# Check what's using the port
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :3001

# Kill the process (replace PID with actual process ID)
sudo kill -9 PID

# Or change ports in docker-compose.prod.yml
# Edit ports section: "3000:3000" → "3002:3000"
```

## 🌐 Network Issues

### Cannot Access Application

**Symptoms:** Browser shows "This site can't be reached" or timeout

**Solutions:**
1. **Check firewall ports are open:**
   - Go to Lightsail instance → Networking tab
   - Verify ports 3000 and 3001 are open
   - Source should be "Anywhere (0.0.0.0/0)"

2. **Check containers are running:**
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```
   All should show "Up"

3. **Check if services are listening:**
   ```bash
   # From inside container
   docker-compose -f docker-compose.prod.yml exec backend netstat -tulpn
   ```

4. **Verify static IP:**
   - Use the correct static IP from Lightsail console
   - Format: `http://YOUR_IP:3001`

### CORS Errors

**Symptoms:** Browser console shows CORS errors when accessing API

**Solutions:**
```bash
# Check backend/.env
# FRONTEND_URL should match your frontend URL
nano backend/.env

# Restart backend after changing
docker-compose -f docker-compose.prod.yml restart backend
```

## 🔐 Authentication Issues

### Cannot Login

**Symptoms:** Login fails with "Invalid credentials" or 401 error

**Solutions:**
1. **Verify admin user exists:**
   ```bash
   docker-compose -f docker-compose.prod.yml exec db mysql -u gstore -p gstore_warranty
   # Enter password from .env
   
   SELECT username, role FROM users;
   ```

2. **Create admin user again:**
   ```bash
   ./scripts/create-admin.sh
   ```

3. **Check JWT secret:**
   - Ensure `JWT_SECRET` in `backend/.env` is set
   - Should be a long random string

### Token Expired

**Symptoms:** "Token expired" or "Unauthorized" after some time

**Solutions:**
- This is normal - tokens expire after 7 days (configurable)
- Simply login again
- To change expiration, update `JWT_EXPIRES_IN` in `backend/.env`

## 💾 Database Issues

### Database Won't Start

**Symptoms:** Database container keeps restarting

**Solutions:**
```bash
# Check database logs
docker-compose -f docker-compose.prod.yml logs db

# Check disk space
df -h

# Remove old database volume (WARNING: deletes data)
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d db
```

### Can't Connect to Database

**Symptoms:** "Access denied" or "Unknown database"

**Solutions:**
```bash
# Verify database credentials in .env
cat backend/.env | grep DB_

# Test connection manually
docker-compose -f docker-compose.prod.yml exec db mysql -u gstore -p
# Enter password from DB_PASSWORD in .env

# If access denied, check user exists
docker-compose -f docker-compose.prod.yml exec db mysql -u root -p
# Then:
CREATE USER IF NOT EXISTS 'gstore'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON gstore_warranty.* TO 'gstore'@'%';
FLUSH PRIVILEGES;
```

## 📦 Build Issues

### Frontend Build Fails

**Symptoms:** Build errors during `docker-compose up --build`

**Solutions:**
```bash
# Check frontend/.env exists
ls -la frontend/.env

# Check Node.js version in Dockerfile
# Should be Node 18

# Try building frontend separately
cd frontend
docker build -t test-frontend .
```

### Backend Build Fails

**Symptoms:** TypeScript compilation errors

**Solutions:**
```bash
# Check for syntax errors
cd backend
npm install
npm run build

# Check TypeScript version
npm list typescript
```

## 🐳 Docker Issues

### Docker Permission Denied

**Symptoms:** "permission denied" when running docker commands

**Solutions:**
```bash
# Add user to docker group
sudo usermod -aG docker ubuntu

# Log out and log back in
exit
# Reconnect via SSH

# Verify
docker ps
```

### Docker Out of Memory

**Symptoms:** Containers killed or "out of memory" errors

**Solutions:**
1. **Upgrade Lightsail instance** (more RAM)
2. **Add swap space:**
   ```bash
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```

3. **Limit container resources** in docker-compose.prod.yml

### Docker Compose Not Found

**Symptoms:** "docker-compose: command not found"

**Solutions:**
```bash
# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker-compose --version
```

## 📝 Logs and Debugging

### View All Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f db

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### Check Container Status
```bash
# List all containers
docker-compose -f docker-compose.prod.yml ps

# Detailed info
docker ps -a

# Container resource usage
docker stats
```

### Enter Container Shell
```bash
# Backend container
docker-compose -f docker-compose.prod.yml exec backend sh

# Database container
docker-compose -f docker-compose.prod.yml exec db bash

# Frontend container
docker-compose -f docker-compose.prod.yml exec frontend sh
```

## 🔄 Restart and Recovery

### Restart All Services
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Restart Specific Service
```bash
docker-compose -f docker-compose.prod.yml restart backend
docker-compose -f docker-compose.prod.yml restart frontend
docker-compose -f docker-compose.prod.yml restart db
```

### Complete Reset (WARNING: Deletes Data)
```bash
# Stop and remove everything
docker-compose -f docker-compose.prod.yml down -v

# Rebuild and start
docker-compose -f docker-compose.prod.yml up -d --build
```

### Restore from Backup
```bash
# Restore database backup
docker-compose -f docker-compose.prod.yml exec -T db mysql -u gstore -p gstore_warranty < backup_file.sql
```

## 🌍 Domain and SSL Issues

### Domain Not Resolving

**Symptoms:** Domain doesn't point to your IP

**Solutions:**
```bash
# Check DNS
nslookup warranty.gstore.ge

# Verify A record points to your static IP
# Wait 5-30 minutes for DNS propagation
```

### SSL Certificate Failed

**Symptoms:** Certbot fails to get certificate

**Solutions:**
1. **Verify domain points to your IP:**
   ```bash
   nslookup warranty.gstore.ge
   ```

2. **Check Nginx configuration:**
   ```bash
   sudo nginx -t
   ```

3. **Ensure port 80 is open** in Lightsail firewall

4. **Try certbot again:**
   ```bash
   sudo certbot --nginx -d warranty.gstore.ge
   ```

## 📊 Performance Issues

### Application Slow

**Symptoms:** Pages load slowly

**Solutions:**
1. **Check resource usage:**
   ```bash
   docker stats
   ```

2. **Upgrade Lightsail instance** (more CPU/RAM)

3. **Check database performance:**
   ```bash
   docker-compose -f docker-compose.prod.yml exec db mysql -u gstore -p
   SHOW PROCESSLIST;
   ```

### Out of Disk Space

**Symptoms:** "No space left on device"

**Solutions:**
```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a

# Remove old images
docker image prune -a
```

## 🆘 Getting Help

If you're still stuck:

1. **Collect information:**
   ```bash
   # Save logs
   docker-compose -f docker-compose.prod.yml logs > logs.txt
   
   # Save container status
   docker-compose -f docker-compose.prod.yml ps > status.txt
   
   # Save environment (remove passwords!)
   env | grep -E "(DB_|JWT_|WOO_|BOG_|SENDER_)" > env.txt
   ```

2. **Check documentation:**
   - `QUICK_START_LIGHTSAIL.md`
   - `docs/AWS_LIGHTSAIL_DEPLOYMENT.md`

3. **Verify all steps:**
   - Use `DEPLOYMENT_CHECKLIST.md` to verify you completed everything

## ✅ Health Check Commands

Run these to verify everything is working:

```bash
# 1. Containers running
docker-compose -f docker-compose.prod.yml ps

# 2. Services responding
curl http://localhost:3000/api/health
curl http://localhost:3001

# 3. Database accessible
docker-compose -f docker-compose.prod.yml exec db mysql -u gstore -p -e "SELECT 1"

# 4. No errors in logs
docker-compose -f docker-compose.prod.yml logs --tail=50 | grep -i error
```

If all pass, your application is healthy! 🎉

