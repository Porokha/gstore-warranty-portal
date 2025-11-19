# WooCommerce Credentials Setup Guide

## Step 1: Add Credentials to Backend .env File

You need to add your WooCommerce credentials to the backend's `.env` file on your Lightsail server.

### On Your Lightsail Server:

1. **SSH into your Lightsail instance:**
   ```bash
   ssh ubuntu@3.68.134.145
   ```

2. **Navigate to your project directory:**
   ```bash
   cd ~/gstore-warranty-portal
   ```

3. **Edit the backend .env file:**
   ```bash
   nano backend/.env
   ```

4. **Add or update these lines with your WooCommerce credentials:**
   ```env
   # WooCommerce Integration
   WOOCOMMERCE_URL=https://your-store.com
   WOOCOMMERCE_CONSUMER_KEY=ck_your_consumer_key_here
   WOOCOMMERCE_CONSUMER_SECRET=cs_your_consumer_secret_here
   ```

   **Replace:**
   - `https://your-store.com` with your actual WooCommerce store URL
   - `ck_your_consumer_key_here` with your Consumer Key (starts with `ck_`)
   - `cs_your_consumer_secret_here` with your Consumer Secret (starts with `cs_`)

5. **Save the file:**
   - Press `Ctrl + X`
   - Press `Y` to confirm
   - Press `Enter` to save

### Example .env file:

```env
# Server Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
DB_TYPE=mysql
DB_HOST=db
DB_PORT=3306
DB_NAME=gstore_warranty
DB_USER=gstore
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# WooCommerce Integration
WOOCOMMERCE_URL=https://shop.gstore.ge
WOOCOMMERCE_CONSUMER_KEY=ck_abc123def456ghi789jkl012mno345pqr678
WOOCOMMERCE_CONSUMER_SECRET=cs_xyz789uvw456rst123opq012nml345kji678

# BOG Payment Gateway
BOG_API_URL=https://api.bog.ge
BOG_MERCHANT_ID=your_merchant_id
BOG_SECRET_KEY=your_secret_key
BOG_CALLBACK_URL=https://warranty.gstore.ge/api/bog/callback

# Sender SMS API
SENDER_API_URL=https://api.sender.ge
SENDER_API_KEY=your_sender_api_key
SENDER_SENDER_NAME=Gstore

# File Upload
UPLOAD_DEST=./uploads
MAX_FILE_SIZE=10485760

# Frontend URL (for CORS and links)
FRONTEND_URL=http://3.68.134.145:3001

# Portal URL (for SMS links)
PORTAL_URL=http://3.68.134.145:3001
```

## Step 2: Verify Webhook URL

Make sure your WooCommerce webhook is configured with the correct URL:

**Webhook URL:**
```
http://3.68.134.145:3000/api/woocommerce/webhook/order
```

**Important:** 
- Include the port `:3000`
- Use `http://` (not `https://`) unless you have SSL configured
- The path is `/api/woocommerce/webhook/order`

## Step 3: Restart Backend Service

After adding the credentials, restart the backend to load the new environment variables:

```bash
cd ~/gstore-warranty-portal
docker-compose -f docker-compose.prod.yml restart backend
```

Or if you want to see the logs:
```bash
docker-compose -f docker-compose.prod.yml restart backend
docker-compose -f docker-compose.prod.yml logs -f backend
```

## Step 4: Test the Integration

### Test 1: Check if credentials are loaded

Check the backend logs to see if there are any errors:
```bash
docker-compose -f docker-compose.prod.yml logs backend | grep -i woo
```

### Test 2: Test webhook manually

You can test the webhook endpoint manually:
```bash
curl -X POST http://localhost:3000/api/woocommerce/webhook/order \
  -H "Content-Type: application/json" \
  -d '{"id": 123, "status": "completed"}'
```

### Test 3: Test with a real order

1. Go to your WooCommerce store
2. Create a test order (or use an existing one)
3. Change the order status to "Completed"
4. Check the backend logs:
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f backend
   ```
5. Check if a warranty was created in the database or through the warranty portal UI

## Step 5: Verify Firewall Settings

Make sure port 3000 is open in Lightsail:

1. Go to AWS Lightsail Console
2. Select your instance
3. Go to **Networking** tab
4. Click **Add rule** or edit existing rules
5. Add:
   - **Application:** Custom
   - **Protocol:** TCP
   - **Port:** 3000
   - **Source:** Anywhere (0.0.0.0/0)

## Troubleshooting

### Issue: Webhook still not working

1. **Check if backend is running:**
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

2. **Check backend logs for errors:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs backend
   ```

3. **Test webhook from WooCommerce:**
   - Go to WooCommerce → Settings → Advanced → Webhooks
   - Click on your webhook
   - Click "Send test" or check delivery logs

4. **Verify the webhook URL is accessible:**
   ```bash
   curl http://3.68.134.145:3000/api/woocommerce/webhook/order
   ```
   (This should return an error about method not allowed, which is fine - it means the endpoint exists)

### Issue: "WooCommerce credentials not configured" warning

This means the environment variables are not loaded. Check:
1. The `.env` file exists in `backend/.env`
2. The credentials are correctly formatted (no extra spaces, quotes, etc.)
3. You restarted the backend service after adding credentials

### Issue: Authentication errors

If you get authentication errors:
1. Double-check your Consumer Key and Secret are correct
2. Make sure there are no extra spaces or quotes
3. Verify the API key has **Read/Write** permissions in WooCommerce
4. Check that the user associated with the API key is still active

## Quick Reference

**File to edit:** `backend/.env` (on Lightsail server)

**Environment variables to add:**
```env
WOOCOMMERCE_URL=https://your-store.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxx
```

**Webhook URL in WooCommerce:**
```
http://3.68.134.145:3000/api/woocommerce/webhook/order
```

**Restart command:**
```bash
docker-compose -f docker-compose.prod.yml restart backend
```

