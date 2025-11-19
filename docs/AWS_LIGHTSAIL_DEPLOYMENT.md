# AWS Lightsail Deployment Guide

This guide will walk you through deploying the Gstore Warranty Portal on AWS Lightsail step by step.

## Prerequisites

- AWS account
- Basic knowledge of terminal/command line
- Domain name (optional, but recommended)

## Step 1: Create AWS Lightsail Instance

### 1.1 Login to AWS Console
1. Go to [AWS Console](https://console.aws.amazon.com)
2. Navigate to **Lightsail** service
3. Click **Create instance**

### 1.2 Configure Instance
- **Instance location**: Choose closest region (e.g., Europe - Frankfurt)
- **Platform**: Linux/Unix
- **Blueprint**: Choose **OS Only** → **Ubuntu 22.04 LTS**
- **Instance plan**: 
  - Start with **$10/month** (2GB RAM, 1 vCPU) for testing
  - Upgrade later if needed
- **Instance name**: `gstore-warranty-portal`
- Click **Create instance**

### 1.3 Wait for Instance to Start
- Wait 2-3 minutes for instance to be ready
- Status should show "Running"

## Step 2: Connect to Your Instance

### 2.1 Get Connection Details
1. Click on your instance name
2. Click **Connect using SSH** button
3. This opens a browser-based terminal

**OR** use SSH from your local machine:
1. Click **Account** → **SSH keys** → **Download** (if you want to use your own SSH client)
2. Use the public IP address shown on instance page

### 2.2 Connect via SSH
```bash
# From your local terminal (if you downloaded SSH key)
ssh -i ~/Downloads/LightsailDefaultKey-*.pem ubuntu@YOUR_INSTANCE_IP

# Or use the browser-based terminal (easiest for beginners)
```

## Step 3: Install Required Software

Run these commands one by one on your Lightsail instance:

### 3.1 Update System
```bash
sudo apt update
sudo apt upgrade -y
```

### 3.2 Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (so you don't need sudo)
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

**Important**: Log out and log back in for docker group changes to take effect:
```bash
exit
# Then reconnect via SSH
```

### 3.3 Install Git
```bash
sudo apt install git -y
```

### 3.4 Install Node.js (for building, optional if using Docker)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

## Step 4: Upload Your Project

### Option A: Using Git (Recommended)

#### 4.1 Create GitHub Repository
1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `gstore-warranty-portal`
3. Make it private (recommended)

#### 4.2 Push Your Code
From your local machine:
```bash
cd /Users/gstore/platform-project

# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Add your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/gstore-warranty-portal.git
git push -u origin main
```

#### 4.3 Clone on Lightsail
On your Lightsail instance:
```bash
cd ~
git clone https://github.com/YOUR_USERNAME/gstore-warranty-portal.git
cd gstore-warranty-portal
```

### Option B: Using SCP (Direct Upload)

From your local machine:
```bash
# Create a zip file
cd /Users/gstore
zip -r platform-project.zip platform-project

# Upload to Lightsail (replace with your instance IP)
scp -i ~/Downloads/LightsailDefaultKey-*.pem platform-project.zip ubuntu@YOUR_INSTANCE_IP:~/

# Then on Lightsail instance:
unzip platform-project.zip
cd platform-project
```

## Step 5: Configure Environment Variables

### 5.1 Create Environment Files
On your Lightsail instance:
```bash
cd ~/gstore-warranty-portal

# Backend environment
cp backend/.env.example backend/.env
nano backend/.env  # or use vi if you prefer
```

### 5.2 Edit Backend .env File
Press `Ctrl+X`, then `Y`, then `Enter` to save in nano.

Update these values:
```env
NODE_ENV=production
PORT=3000

# Database - we'll use Docker, so:
DB_TYPE=mysql
DB_HOST=db
DB_PORT=3306
DB_NAME=gstore_warranty
DB_USER=gstore
DB_PASSWORD=CHANGE_THIS_TO_STRONG_PASSWORD

# JWT - Generate a strong secret
JWT_SECRET=YOUR_VERY_LONG_RANDOM_SECRET_HERE
JWT_EXPIRES_IN=7d

# WooCommerce
WOOCOMMERCE_URL=https://your-store.com
WOOCOMMERCE_CONSUMER_KEY=your_key
WOOCOMMERCE_CONSUMER_SECRET=your_secret

# BOG Payment
BOG_API_URL=https://api.bog.ge
BOG_MERCHANT_ID=your_merchant_id
BOG_SECRET_KEY=your_secret_key
BOG_CALLBACK_URL=https://warranty.gstore.ge/api/bog/callback

# Sender SMS
SENDER_API_URL=https://api.sender.ge
SENDER_API_KEY=your_api_key
SENDER_SENDER_NAME=Gstore

# Frontend URL (use your domain or Lightsail static IP)
FRONTEND_URL=http://YOUR_STATIC_IP:3001
PORTAL_URL=https://warranty.gstore.ge

# File Upload
UPLOAD_DEST=./uploads
MAX_FILE_SIZE=10485760
```

### 5.3 Edit Frontend .env File
```bash
cp frontend/.env.example frontend/.env
nano frontend/.env
```

Update:
```env
REACT_APP_API_URL=http://YOUR_STATIC_IP:3000/api
REACT_APP_PORTAL_URL=http://YOUR_STATIC_IP:3001
REACT_APP_NAME=Gstore Warranty Portal
```

**Note**: Replace `YOUR_STATIC_IP` with your Lightsail instance's static IP (found on instance page).

## Step 6: Update Docker Compose for Production

We'll create a production-ready docker-compose file:

```bash
nano docker-compose.prod.yml
```

I'll create this file for you in the next step.

## Step 7: Start the Application

### 7.1 Build and Start Services
```bash
cd ~/gstore-warranty-portal

# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# Check if everything is running
docker-compose -f docker-compose.prod.yml ps

# View logs if needed
docker-compose -f docker-compose.prod.yml logs -f
```

### 7.2 Wait for Database to Initialize
```bash
# Check database logs
docker-compose -f docker-compose.prod.yml logs db

# Wait until you see "ready for connections"
```

### 7.3 Run Database Migrations
```bash
# Enter backend container
docker-compose -f docker-compose.prod.yml exec backend sh

# Inside container, run migrations
npm run migration:run

# Or if using synchronize (development only)
# Just restart the backend container
exit
```

## Step 8: Configure Firewall (Ports)

### 8.1 Open Ports in Lightsail
1. Go to your Lightsail instance page
2. Click **Networking** tab
3. Click **Add rule**
4. Add these rules:
   - **Application**: Custom
   - **Protocol**: TCP
   - **Port**: 3000 (Backend API)
   - **Source**: Anywhere (0.0.0.0/0)
   - Click **Save**

   Repeat for:
   - Port 3001 (Frontend)
   - Port 3306 (MySQL - optional, only if you need external access)

### 8.2 Test Access
Open in your browser:
- Frontend: `http://YOUR_STATIC_IP:3001`
- Backend API: `http://YOUR_STATIC_IP:3000/api`
- API Docs: `http://YOUR_STATIC_IP:3000/api/docs`

## Step 9: Create Initial Admin User

### 9.1 Access Database
```bash
docker-compose -f docker-compose.prod.yml exec db mysql -u gstore -p
# Enter password from .env file
```

### 9.2 Create Admin User
```sql
USE gstore_warranty;

-- Generate password hash first (we'll do this via Node.js)
-- Exit MySQL
exit;
```

### 9.3 Generate Password Hash
```bash
# Enter backend container
docker-compose -f docker-compose.prod.yml exec backend sh

# Run Node.js to hash password
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your_admin_password', 10).then(hash => console.log(hash));"
# Copy the hash output
exit
```

### 9.4 Insert Admin User
```bash
docker-compose -f docker-compose.prod.yml exec db mysql -u gstore -p gstore_warranty
```

```sql
INSERT INTO users (name, last_name, username, password_hash, role, language_pref)
VALUES ('Admin', 'User', 'admin', 'PASTE_HASH_HERE', 'admin', 'en');
exit;
```

## Step 10: Test the Application

1. **Frontend**: Visit `http://YOUR_STATIC_IP:3001`
2. **Staff Login**: Go to `http://YOUR_STATIC_IP:3001/staff/login`
   - Username: `admin`
   - Password: (the one you set)
3. **Public Portal**: Visit `http://YOUR_STATIC_IP:3001`

## Step 11: Set Up Domain (Optional but Recommended)

### 11.1 Point Domain to Lightsail
1. Get your static IP from Lightsail instance page
2. In your domain registrar (e.g., GoDaddy, Namecheap):
   - Add A record: `warranty.gstore.ge` → `YOUR_STATIC_IP`
   - Wait for DNS propagation (5-30 minutes)

### 11.2 Update Environment Variables
Update `FRONTEND_URL` and `PORTAL_URL` in `backend/.env` to use your domain:
```env
FRONTEND_URL=https://warranty.gstore.ge
PORTAL_URL=https://warranty.gstore.ge
```

### 11.3 Set Up SSL (HTTPS)
We'll use Nginx reverse proxy with Let's Encrypt. See SSL setup section below.

## Step 12: Set Up SSL/HTTPS (Recommended)

### 12.1 Install Nginx and Certbot
```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

### 12.2 Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/warranty.gstore.ge
```

Add this configuration (I'll create a template file for you):
```nginx
server {
    listen 80;
    server_name warranty.gstore.ge;

    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 12.3 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/warranty.gstore.ge /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### 12.4 Get SSL Certificate
```bash
sudo certbot --nginx -d warranty.gstore.ge
```

Follow the prompts. Certbot will automatically configure SSL.

## Troubleshooting

### Check Container Status
```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs [service_name]
```

### Restart Services
```bash
docker-compose -f docker-compose.prod.yml restart
# Or restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f db
```

### Database Connection Issues
```bash
# Check if database is running
docker-compose -f docker-compose.prod.yml exec db mysql -u gstore -p

# Test connection from backend
docker-compose -f docker-compose.prod.yml exec backend sh
# Inside container, you can test DB connection
```

### Port Already in Use
```bash
# Check what's using the port
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :3001

# Kill process if needed
sudo kill -9 [PID]
```

### Out of Memory
If you get out of memory errors:
1. Upgrade your Lightsail instance plan
2. Or add swap space:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## Maintenance Commands

### Update Application
```bash
cd ~/gstore-warranty-portal
git pull  # If using Git
docker-compose -f docker-compose.prod.yml up -d --build
```

### Backup Database
```bash
docker-compose -f docker-compose.prod.yml exec db mysqldump -u gstore -p gstore_warranty > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
docker-compose -f docker-compose.prod.yml exec -T db mysql -u gstore -p gstore_warranty < backup_20231219.sql
```

## Next Steps

1. ✅ Test all functionality
2. ✅ Configure WooCommerce integration
3. ✅ Set up BOG payment gateway
4. ✅ Configure SMS provider
5. ✅ Set up automated backups
6. ✅ Configure monitoring/alerts
7. ✅ Set up CI/CD pipeline (optional)

## Support

If you encounter issues:
1. Check logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify environment variables
3. Check firewall/port settings
4. Verify database is running and accessible

