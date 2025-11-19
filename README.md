# Gstore Warranty & Service Portal

**Domain:** warranty.gstore.ge  
**Version:** 1.0.0

A comprehensive warranty and service management platform for Gstore with separate staff authentication, WooCommerce integration, customer self-service portal, and full admin/technician backend.

## 🏗️ Architecture

- **Frontend:** React SPA with React Router, i18next (EN/KA), Material-UI or Tailwind CSS
- **Backend:** NestJS REST API with JWT authentication
- **Database:** MySQL/PostgreSQL (configurable)
- **Integrations:**
  - WooCommerce REST API (order import)
  - BOG Payment Gateway (online payments)
  - Sender API (SMS notifications)

## 📁 Project Structure

```
.
├── frontend/          # React application
├── backend/           # NestJS API
├── database/          # Migrations and schema
├── docker/           # Docker configurations
└── docs/             # Additional documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- MySQL 8+ or PostgreSQL 14+
- Docker & Docker Compose (optional, for containerized deployment)

### Development Setup

1. **Install dependencies:**
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd frontend && npm install
   ```

2. **Configure environment:**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   # Edit .env files with your configuration
   ```

3. **Run database migrations:**
   ```bash
   cd backend && npm run migration:run
   ```

4. **Start development servers:**
   ```bash
   # Backend (port 3000)
   cd backend && npm run start:dev
   
   # Frontend (port 3001)
   cd frontend && npm start
   ```

### Docker Deployment

```bash
docker-compose up -d
```

### 🚀 AWS Lightsail Deployment

**Ready to deploy on AWS Lightsail?** Follow our step-by-step guides:

- **📘 Quick Start Guide**: See [`QUICK_START_LIGHTSAIL.md`](./QUICK_START_LIGHTSAIL.md) for a simplified deployment process
- **📚 Detailed Guide**: See [`docs/AWS_LIGHTSAIL_DEPLOYMENT.md`](./docs/AWS_LIGHTSAIL_DEPLOYMENT.md) for comprehensive instructions

**Quick deployment steps:**
1. Create Lightsail instance (Ubuntu 22.04)
2. Install Docker & Docker Compose
3. Clone/upload your code
4. Configure environment variables
5. Run `./scripts/deploy.sh`
6. Create admin user with `./scripts/create-admin.sh`
7. Open firewall ports (3000, 3001)

All deployment scripts and configurations are included!

## 📋 Features

### Staff Portal (Admin & Technician)
- ✅ Role-based access control (Admin/Technician)
- ✅ Dashboard with real-time metrics
- ✅ Service case management with 4-level status workflow
- ✅ Warranty product management
- ✅ Payment and offer management
- ✅ SMS template and settings management
- ✅ Audit logging
- ✅ Bilingual UI (English/Georgian)

### Customer Portal
- ✅ Warranty lookup by ID + Phone
- ✅ Case tracking by case number
- ✅ Status timeline visualization
- ✅ Payment acceptance (online/onsite)
- ✅ Replacement acceptance
- ✅ Return as-is option

### Integrations
- ✅ WooCommerce order import (automatic + manual)
- ✅ BOG payment gateway integration
- ✅ SMS notifications via Sender API
- ✅ SLA monitoring and alerts

## 🔐 Roles & Permissions

### Admin
- Full system access
- Can move case statuses forward/backward
- Can reopen closed cases
- Can extend warranty end dates
- Can manage users and SMS settings
- Full audit log access

### Technician
- Can create warranties and cases
- Can only move status forward (1→2→3→4)
- Can create offers (Covered/Payable/Replaceable)
- Can update payment status
- Can upload files
- View-only audit logs

## 📊 Status & Result System

### Case Status (4-level)
1. **Opened** (ღია) - Grey
2. **Investigating** (კვლევა) - Red
3. **Pending** (მოლოდინში) - Yellow
4. **Completed** (დასრულებული) - Green

### Result Types
1. **Covered** (გარანტიით შეკეთებული) - Grey
2. **Payable** (გადასახდელი) - Green
3. **Returned** (დაბრუნდა როგორც არის) - Yellow
4. **Replaceable** (შესაცვლელი) - Red

## 🌐 API Documentation

API documentation will be available at `/api/docs` when the backend is running (Swagger/OpenAPI).

## 📝 Environment Variables

See `.env.example` files in `backend/` and `frontend/` directories for required configuration.

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## 📄 License

Proprietary - Gstore Internal Use

---

**Next Steps:**
1. Review and customize configuration files
2. Set up database connection
3. Configure WooCommerce, BOG, and Sender API credentials
4. Run initial migrations
5. Create first admin user
6. Test integrations
