# Quick Start Guide - AWS Lightsail Deployment

This is a simplified step-by-step guide for deploying on AWS Lightsail.

## 🎯 Prerequisites Checklist

- [ ] AWS account created
- [ ] Basic terminal/SSH knowledge
- [ ] Your WooCommerce, BOG, and Sender API credentials ready

## 📋 Step-by-Step Instructions

### Step 1: Create Lightsail Instance (5 minutes)

1. Go to [AWS Lightsail Console](https://lightsail.aws.amazon.com)
2. Click **Create instance**
3. Choose:
   - **Platform**: Linux/Unix
   - **Blueprint**: OS Only → Ubuntu 22.04 LTS
   - **Plan**: $10/month (2GB RAM) - good for testing
   - **Name**: `gstore-warranty`
4. Click **Create instance**
5. Wait 2-3 minutes for it to start

### Step 2: Connect to Instance (2 minutes)

1. Click on your instance name
2. Click **Connect using SSH** (browser terminal opens)
3. You're now connected! ✅

### Step 3: Install Docker (5 minutes)

Copy and paste these commands one by one:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install git -y

# Verify (should show versions)
docker --version
docker-compose --version
```

**Important**: Type `exit` and reconnect via SSH for docker group to work.

### Step 4: Get Your Code on Server (5 minutes)

#### Option A: Using Git (Recommended)

1. **On your local machine**, push code to GitHub:
```bash
cd /Users/gstore/platform-project
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/gstore-warranty-portal.git
git push -u origin main
```

2. **On Lightsail instance**, clone it:
```bash
cd ~
git clone https://github.com/YOUR_USERNAME/gstore-warranty-portal.git
cd gstore-warranty-portal
```

#### Option B: Direct Upload (Alternative)

1. **On your local machine**:
```bash
cd /Users/gstore
zip -r platform-project.zip platform-project
```

2. Upload via Lightsail file manager or use SCP (advanced)

### Step 5: Configure Environment (10 minutes)

1. **Get your static IP** from Lightsail instance page (looks like `54.123.45.67`)

2. **Create backend .env file**:
```bash
cd ~/gstore-warranty-portal
cp backend/.env.example backend/.env
nano backend/.env
```

3. **Edit the file** - Update these important lines:
```env
DB_PASSWORD=ChooseAStrongPassword123!
JWT_SECRET=GenerateVeryLongRandomStringHere123456789
FRONTEND_URL=http://YOUR_STATIC_IP:3001
PORTAL_URL=http://YOUR_STATIC_IP:3001
```

   - Press `Ctrl+X`, then `Y`, then `Enter` to save

4. **Create frontend .env file**:
```bash
cp frontend/.env.example frontend/.env
nano frontend/.env
```

   Update:
```env
REACT_APP_API_URL=http://YOUR_STATIC_IP:3000/api
REACT_APP_PORTAL_URL=http://YOUR_STATIC_IP:3001
```

   Save and exit (`Ctrl+X`, `Y`, `Enter`)

### Step 6: Deploy Application (10 minutes)

```bash
cd ~/gstore-warranty-portal

# Make scripts executable
chmod +x scripts/*.sh

# Deploy (this builds and starts everything)
docker-compose -f docker-compose.prod.yml up -d --build

# Wait 30 seconds for everything to start
sleep 30

# Check status
docker-compose -f docker-compose.prod.yml ps
```

You should see 3 containers running: `db`, `backend`, `frontend`

### Step 7: Open Firewall Ports (3 minutes)

1. Go to Lightsail instance page
2. Click **Networking** tab
3. Click **Add rule** for each:
   - Port **3000** (Backend) - Protocol: TCP
   - Port **3001** (Frontend) - Protocol: TCP
4. Click **Save**

### Step 8: Create Admin User (5 minutes)

```bash
cd ~/gstore-warranty-portal
./scripts/create-admin.sh
```

Follow the prompts:
- Username: `admin` (or your choice)
- Password: (choose a strong password)
- Name: `Admin`
- Last name: `User`

### Step 9: Test It! 🎉

1. **Open in browser**: `http://YOUR_STATIC_IP:3001`
2. **Staff login**: `http://YOUR_STATIC_IP:3001/staff/login`
   - Username: `admin`
   - Password: (what you set)
3. **API docs**: `http://YOUR_STATIC_IP:3000/api/docs`

## ✅ Success Checklist

- [ ] Can access frontend at `http://YOUR_IP:3001`
- [ ] Can login to staff portal
- [ ] Can see dashboard
- [ ] API docs accessible at `http://YOUR_IP:3000/api/docs`

## 🔧 Common Issues & Fixes

### "Cannot connect" error
- Check firewall ports are open (Step 7)
- Wait 1-2 minutes after starting containers

### "Database connection failed"
- Check `backend/.env` has correct DB_PASSWORD
- Wait for database to fully start: `docker-compose -f docker-compose.prod.yml logs db`

### "Permission denied" on scripts
```bash
chmod +x scripts/*.sh
```

### Containers not starting
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Restart
docker-compose -f docker-compose.prod.yml restart
```

## 📚 Next Steps

1. **Set up domain** (optional): Point `warranty.gstore.ge` to your static IP
2. **Configure SSL**: Use Let's Encrypt (see full deployment guide)
3. **Add integrations**: WooCommerce, BOG, SMS
4. **Set up backups**: Use the backup script regularly

## 🆘 Need Help?

1. Check logs: `docker-compose -f docker-compose.prod.yml logs -f`
2. See full guide: `docs/AWS_LIGHTSAIL_DEPLOYMENT.md`
3. Verify environment variables are correct
4. Check firewall/ports are open

## 📝 Useful Commands

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

# Check container status
docker-compose -f docker-compose.prod.yml ps
```

---

**🎊 Congratulations!** Your application should now be running on AWS Lightsail!

