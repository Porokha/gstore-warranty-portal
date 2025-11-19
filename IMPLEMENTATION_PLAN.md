# Implementation Plan - Gstore Warranty Portal

This document tracks the implementation progress of features from the blueprint.

## ✅ Completed

- [x] Project structure setup
- [x] Database schema and entities
- [x] Authentication system (JWT)
- [x] Basic routing and layouts
- [x] CORS configuration
- [x] Dashboard API endpoints (basic)

## 🚧 In Progress

- [ ] Dashboard UI with real data
- [ ] Cases CRUD API
- [ ] Cases management UI

## 📋 To Do

### Backend API

#### Cases Management
- [ ] Create case endpoint
- [ ] Update case endpoint
- [ ] Status change endpoint (with role-based restrictions)
- [ ] Result setting endpoint
- [ ] Case history tracking
- [ ] Case filtering and search
- [ ] Case assignment
- [ ] Priority and tags management

#### Warranties Management
- [ ] Create warranty (manual)
- [ ] Update warranty
- [ ] Extend warranty (admin only)
- [ ] Warranty search
- [ ] WooCommerce import endpoint
- [ ] Warranty listing with filters

#### Payments & Offers
- [ ] Create offer endpoint
- [ ] Update payment status
- [ ] Generate pickup code
- [ ] Verify code endpoint
- [ ] BOG payment integration
- [ ] Payment webhook handler

#### Files
- [ ] File upload endpoint
- [ ] File list endpoint
- [ ] File delete endpoint (admin only)
- [ ] File type validation

#### SMS
- [ ] SMS template CRUD
- [ ] SMS settings management
- [ ] SMS sending service
- [ ] Sender API integration
- [ ] SMS queue processing

#### Public Portal
- [ ] Warranty search endpoint
- [ ] Case search endpoint
- [ ] Accept payment endpoint
- [ ] Accept replacement endpoint
- [ ] Return as-is endpoint

#### Audit & Settings
- [ ] Audit log viewing
- [ ] User management (admin)
- [ ] System settings

### Frontend UI

#### Dashboard
- [ ] Real-time metrics display
- [ ] Time filter controls
- [ ] Charts/graphs for analytics
- [ ] Clickable metrics (navigate to filtered lists)

#### Cases Management
- [ ] Cases list with filters
- [ ] Status and result bars (4-grid visualization)
- [ ] Case detail modal (4 tabs)
- [ ] Create case form
- [ ] Status change controls (role-based)
- [ ] Result setting form
- [ ] History timeline
- [ ] File upload interface
- [ ] Priority and tags UI

#### Warranties Management
- [ ] Warranties list
- [ ] Warranty detail view
- [ ] Create warranty form
- [ ] Extend warranty (admin)
- [ ] Create case from warranty

#### Payments & Finance
- [ ] Payments list
- [ ] Payment filters
- [ ] Export functionality
- [ ] Financial analytics

#### Settings
- [ ] User management UI
- [ ] SMS template editor
- [ ] SMS settings toggles
- [ ] System configuration

#### Public Portal
- [ ] Home page with search options
- [ ] Warranty search form
- [ ] Case search form
- [ ] Warranty details view
- [ ] Case timeline view
- [ ] Payment acceptance UI
- [ ] Replacement acceptance UI
- [ ] Return as-is action

### Integrations

- [ ] WooCommerce REST API client
- [ ] WooCommerce order import service
- [ ] BOG payment gateway integration
- [ ] Sender SMS API integration
- [ ] Background job scheduler
- [ ] SLA monitoring service

### Background Jobs

- [ ] SLA monitor (overdue cases)
- [ ] SLA monitor (stalled cases)
- [ ] SMS queue processor
- [ ] Payment webhook handler
- [ ] WooCommerce sync scheduler

## Implementation Priority

### Phase 1: Core Functionality (Current)
1. Dashboard with real data ✅
2. Cases CRUD API
3. Cases list and detail UI
4. Basic case management workflow

### Phase 2: Essential Features
1. Warranties management
2. Payments and offers
3. File uploads
4. Public portal (basic search)

### Phase 3: Advanced Features
1. WooCommerce integration
2. BOG payment gateway
3. SMS notifications
4. SLA monitoring

### Phase 4: Polish & Optimization
1. Advanced filtering
2. Export functionality
3. Performance optimization
4. Comprehensive testing

## Notes

- All features should follow the blueprint specifications
- Bilingual support (EN/KA) should be maintained
- Role-based access control must be enforced
- Audit logging for all important actions
- Error handling and validation throughout

