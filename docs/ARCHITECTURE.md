# Architecture Overview

## System Architecture

```
┌─────────────────┐
│   React SPA     │  Frontend (Port 3001)
│   (Public +     │
│    Staff UI)    │
└────────┬────────┘
         │ HTTP/REST
         │
┌────────▼────────┐
│   NestJS API    │  Backend (Port 3000)
│   (REST API)    │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    │         │          │          │
┌───▼───┐ ┌──▼───┐ ┌────▼────┐ ┌───▼────┐
│ MySQL │ │ Woo  │ │  BOG    │ │ Sender │
│       │ │Commerce│ │Payment │ │  SMS   │
└───────┘ └──────┘ └─────────┘ └────────┘
```

## Technology Stack

### Frontend
- **React 18** - UI framework
- **React Router** - Client-side routing
- **Material-UI** - Component library
- **i18next** - Internationalization (EN/KA)
- **Axios** - HTTP client
- **React Query** - Data fetching and caching

### Backend
- **NestJS** - Node.js framework
- **TypeORM** - ORM for database
- **MySQL/PostgreSQL** - Database
- **JWT** - Authentication
- **Passport** - Authentication strategies
- **Swagger** - API documentation

### Integrations
- **WooCommerce REST API** - Order import
- **BOG Payment Gateway** - Online payments
- **Sender API** - SMS notifications

## Project Structure

```
platform-project/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── contexts/      # React contexts
│   │   ├── locales/       # i18n translations
│   │   └── utils/          # Utility functions
│   └── public/            # Static assets
│
├── backend/               # NestJS API
│   ├── src/
│   │   ├── auth/          # Authentication module
│   │   ├── users/         # User management
│   │   ├── cases/         # Service cases
│   │   ├── warranties/    # Warranty products
│   │   ├── payments/      # Payment handling
│   │   ├── files/         # File uploads
│   │   ├── sms/           # SMS integration
│   │   ├── audit/         # Audit logging
│   │   ├── public/        # Public endpoints
│   │   └── common/        # Shared utilities
│   └── database/          # Migrations
│
├── database/              # Database scripts
│   └── schema.sql         # Reference schema
│
└── docker/                # Docker configs
```

## Data Flow

### Authentication Flow
1. User submits credentials
2. Backend validates against database
3. JWT token issued
4. Token stored in localStorage
5. Token included in subsequent requests

### Case Management Flow
1. Technician creates case
2. Status progresses: Opened → Investigating → Pending → Completed
3. Result type set (Covered/Payable/Returned/Replaceable)
4. Customer notified via SMS (if enabled)
5. Customer actions tracked in portal
6. Payment processed (if Payable)
7. Case completed with code verification

### Warranty Import Flow
1. WooCommerce webhook triggers (or manual import)
2. Backend fetches completed orders
3. Warranty records created for each line item
4. SMS sent to customer (if enabled)
5. Customer can search warranty in portal

## Security Considerations

- JWT tokens with expiration
- Password hashing (bcrypt)
- Role-based access control (RBAC)
- Input validation (class-validator)
- SQL injection prevention (TypeORM)
- CORS configuration
- File upload restrictions

## Deployment

### Development
- Local MySQL/PostgreSQL
- npm run start:dev (both frontend and backend)
- Hot reload enabled

### Production
- Docker containers
- Nginx reverse proxy (frontend)
- Environment variables for secrets
- Database backups
- SSL/TLS certificates

## API Endpoints Overview

### Authentication
- `POST /api/auth/login` - Staff login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Cases
- `GET /api/cases` - List cases
- `GET /api/cases/:id` - Get case details
- `POST /api/cases` - Create case
- `PUT /api/cases/:id` - Update case
- `POST /api/cases/:id/status` - Change status

### Warranties
- `GET /api/warranties` - List warranties
- `GET /api/warranties/:id` - Get warranty
- `POST /api/warranties` - Create warranty
- `POST /api/warranties/import-from-woo` - Import from WooCommerce

### Public
- `POST /api/public/search/warranty` - Search warranty
- `POST /api/public/search/case` - Search case
- `POST /api/public/case/:id/accept-pay` - Accept payment
- `POST /api/public/case/:id/return-as-is` - Return device

## Background Jobs (To Be Implemented)

- SLA monitor (check overdue cases)
- WooCommerce sync scheduler
- SMS queue processor
- Payment webhook handlers

