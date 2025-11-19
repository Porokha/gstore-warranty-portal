# Setup Guide

## Prerequisites

- Node.js 18+ and npm/yarn
- MySQL 8+ or PostgreSQL 14+
- Docker & Docker Compose (optional)

## Initial Setup

### 1. Install Dependencies

```bash
# Root level (optional - for workspace scripts)
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Database Setup

#### Option A: Using Docker Compose

```bash
docker-compose up -d db
```

#### Option B: Manual MySQL Setup

```bash
# Create database
mysql -u root -p
CREATE DATABASE gstore_warranty CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 3. Environment Configuration

#### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials and API keys
```

Key variables to configure:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET` (use a strong secret in production)
- `WOOCOMMERCE_URL`, `WOOCOMMERCE_CONSUMER_KEY`, `WOOCOMMERCE_CONSUMER_SECRET`
- `BOG_API_URL`, `BOG_MERCHANT_ID`, `BOG_SECRET_KEY`
- `SENDER_API_URL`, `SENDER_API_KEY`

#### Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env with your API URL
```

### 4. Database Migrations

```bash
cd backend
npm run migration:run
```

Or if using TypeORM synchronize (development only):
- Set `DB_SYNCHRONIZE=true` in `.env` (NOT recommended for production)

### 5. Create Initial Admin User

You'll need to create the first admin user. You can do this via:

1. Database seed script (to be created)
2. Direct SQL insert
3. Admin registration endpoint (to be implemented)

Example SQL:
```sql
INSERT INTO users (name, last_name, username, password_hash, role, language_pref)
VALUES ('Admin', 'User', 'admin', '$2b$10$...', 'admin', 'en');
```

Use bcrypt to hash the password first.

### 6. Start Development Servers

#### Option A: Run Separately

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm start
```

#### Option B: Use Root Script

```bash
# From project root
npm run dev
```

### 7. Access the Application

- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/api/docs

## Docker Deployment

### Development

```bash
docker-compose up
```

### Production

1. Update environment variables in `docker-compose.yml` or use `.env` file
2. Build and run:

```bash
docker-compose -f docker-compose.yml up -d --build
```

## Next Steps

1. Configure WooCommerce integration
2. Set up BOG payment gateway
3. Configure Sender SMS API
4. Create initial admin user
5. Import existing warranties from WooCommerce
6. Customize SMS templates
7. Test the complete workflow

## Troubleshooting

### Database Connection Issues

- Verify database credentials in `.env`
- Ensure database server is running
- Check firewall settings

### Port Conflicts

- Change ports in `.env` files if 3000 or 3001 are in use
- Update `docker-compose.yml` port mappings

### CORS Issues

- Verify `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check CORS configuration in `backend/src/main.ts`

