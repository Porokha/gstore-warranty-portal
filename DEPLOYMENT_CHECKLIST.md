# AWS Lightsail Deployment Checklist

Use this checklist to ensure you complete all steps for deploying on AWS Lightsail.

## Pre-Deployment

- [ ] AWS account created and logged in
- [ ] Have WooCommerce API credentials ready
- [ ] Have BOG payment gateway credentials ready
- [ ] Have Sender SMS API credentials ready
- [ ] Domain name ready (optional): `warranty.gstore.ge`

## Step 1: Create Lightsail Instance

- [ ] Created Lightsail instance
- [ ] Selected Ubuntu 22.04 LTS
- [ ] Chose appropriate plan ($10/month minimum recommended)
- [ ] Instance is running
- [ ] Noted static IP address

## Step 2: Connect to Instance

- [ ] Connected via SSH (browser terminal or local)
- [ ] Can run commands successfully

## Step 3: Install Software

- [ ] Updated system packages (`sudo apt update && sudo apt upgrade -y`)
- [ ] Docker installed (`docker --version` works)
- [ ] Docker Compose installed (`docker-compose --version` works)
- [ ] Git installed
- [ ] Logged out and back in (for docker group)

## Step 4: Get Code on Server

- [ ] Code uploaded/cloned to server
- [ ] In project directory (`cd ~/gstore-warranty-portal`)

## Step 5: Configure Environment

- [ ] Backend `.env` file created from `.env.example`
- [ ] Database password set (strong password)
- [ ] JWT secret set (long random string)
- [ ] Static IP added to `FRONTEND_URL` and `PORTAL_URL`
- [ ] WooCommerce credentials added (if ready)
- [ ] BOG credentials added (if ready)
- [ ] Sender SMS credentials added (if ready)
- [ ] Frontend `.env` file created
- [ ] Frontend API URL set to static IP

## Step 6: Deploy Application

- [ ] Deployment script is executable (`chmod +x scripts/*.sh`)
- [ ] Ran deployment: `docker-compose -f docker-compose.prod.yml up -d --build`
- [ ] All containers running (`docker-compose -f docker-compose.prod.yml ps`)
- [ ] Database is healthy (check logs)
- [ ] No errors in logs

## Step 7: Configure Firewall

- [ ] Port 3000 (Backend) opened in Lightsail Networking
- [ ] Port 3001 (Frontend) opened in Lightsail Networking
- [ ] Firewall rules saved

## Step 8: Create Admin User

- [ ] Ran `./scripts/create-admin.sh`
- [ ] Admin username set
- [ ] Admin password set (strong password)
- [ ] Admin user created successfully

## Step 9: Test Application

- [ ] Frontend accessible at `http://YOUR_IP:3001`
- [ ] Public portal loads correctly
- [ ] Staff login page accessible at `http://YOUR_IP:3001/staff/login`
- [ ] Can login with admin credentials
- [ ] Dashboard loads after login
- [ ] API docs accessible at `http://YOUR_IP:3000/api/docs`
- [ ] Backend API responds

## Step 10: Domain Setup (Optional)

- [ ] Domain DNS A record points to static IP
- [ ] DNS propagated (checked with `nslookup warranty.gstore.ge`)
- [ ] Updated environment variables with domain
- [ ] Restarted containers with new config

## Step 11: SSL Setup (Optional but Recommended)

- [ ] Nginx installed
- [ ] Nginx configuration file created
- [ ] Site enabled in Nginx
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] HTTPS working (`https://warranty.gstore.ge`)

## Post-Deployment

- [ ] Tested all major features
- [ ] Created backup script schedule
- [ ] Documented admin credentials securely
- [ ] Set up monitoring (optional)
- [ ] Configured WooCommerce integration
- [ ] Configured BOG payment gateway
- [ ] Configured SMS provider
- [ ] Tested SMS notifications
- [ ] Tested payment flow

## Maintenance

- [ ] Regular backups scheduled
- [ ] Log rotation configured
- [ ] Update process documented
- [ ] Monitoring alerts set up (optional)

## Troubleshooting Notes

Document any issues encountered and their solutions:

- Issue: _________________________
- Solution: ______________________

- Issue: _________________________
- Solution: ______________________

---

## Quick Reference

**Access URLs:**
- Frontend: `http://YOUR_IP:3001`
- Backend API: `http://YOUR_IP:3000/api`
- API Docs: `http://YOUR_IP:3000/api/docs`
- Staff Login: `http://YOUR_IP:3001/staff/login`

**Useful Commands:**
```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop everything
docker-compose -f docker-compose.prod.yml down

# Start again
docker-compose -f docker-compose.prod.yml up -d

# Backup database
./scripts/backup-db.sh

# Check status
docker-compose -f docker-compose.prod.yml ps
```

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Instance IP:** _______________  
**Domain:** _______________

