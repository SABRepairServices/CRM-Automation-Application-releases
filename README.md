# Imran Pro Services - CRM & Business Automation Platform

Complete business management system for repair businesses, social media automation, and customer relationship management.

## Features

### 🏢 Multi-Client Management
- Manage multiple businesses in a single instance
- Isolated customer data per client (Row Level Security)
- Client-specific statistics and reporting

### 👥 Customer CRM
- Lead/customer management with full CRUD operations
- Track customer status (new, contacted, booked, active, done, lost)
- Customer source tracking (Google, Instagram, Facebook, WhatsApp, Referral, Walk-in)
- Bulk import functionality for CSV customer lists
- Real-time customer statistics

### 🔧 Repair Job Workflow
- Complete job lifecycle: new → scheduled → inspected → quoted → approved → in_progress → completed
- Job assignment to technicians
- Inspection notes and photo tracking
- Job status overview and filtering

### 💰 Quotations & Invoicing
- Create detailed quotations with line items
- Track quotation status (pending, approved, rejected)
- Generate invoices from jobs
- Invoice payment tracking
- Monthly invoice summaries (indent sheets)

### 📱 Social Media Integration (Phase 2 - In Progress)
- ✅ Social account management (connect Facebook, Instagram, TikTok, Twitter, LinkedIn, YouTube)
- ✅ Multi-platform posting interface
- ✅ Draft, schedule, and publish posts
- ✅ Real-time post status tracking
- 🔜 Post analytics and engagement tracking
- 🔜 AI-powered caption generation
- 🔜 Automatic scheduling and queue management

## Tech Stack

### Frontend
- **Framework:** Next.js 14 (React)
- **Language:** TypeScript
- **UI:** Tailwind CSS
- **State:** React Hooks + Context API
- **HTTP:** Axios
- **Runtime:** Browser (Client-side rendering)

### Backend
- **Framework:** Express.js
- **Language:** JavaScript (Node.js)
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** JWT (Bearer tokens)
- **ORM:** Raw SQL queries (prepared statements)
- **Runtime:** Node.js

### Database
- **Provider:** Supabase (PostgreSQL)
- **Authentication:** JWT with Row Level Security (RLS)
- **Schema Management:** SQL migrations
- **Tables:** clients, users, customers, repair_jobs, quotations, invoices, technicians, payments

## Project Structure

```
D:\Developer Application\Social-Media-Automation\
├── Web/                           # Frontend (Next.js)
│   ├── src/
│   │   ├── app/                  # Next.js pages
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── dashboard/
│   │   │   ├── clients/
│   │   │   ├── customers/
│   │   │   ├── jobs/
│   │   │   ├── quotes/
│   │   │   ├── invoices/
│   │   │   ├── posts/
│   │   │   └── settings/
│   │   ├── components/           # React components
│   │   │   ├── Sidebar.tsx
│   │   │   └── ClientSelector.tsx
│   │   ├── hooks/                # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useClients.ts
│   │   │   ├── useCustomers.ts
│   │   │   ├── useJobs.ts
│   │   │   ├── useQuotations.ts
│   │   │   └── useInvoices.ts
│   │   ├── context/              # React context
│   │   │   └── AuthContext.tsx
│   │   └── globals.css           # Global styles
│   ├── .env.example              # Environment variables template
│   ├── next.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── API/                           # Backend (Express.js)
│   ├── app/
│   │   ├── middleware/
│   │   │   └── authenticate.js   # JWT middleware
│   │   ├── routes/               # API endpoints
│   │   │   ├── clientRoutes.js
│   │   │   ├── customerRoutes.js
│   │   │   ├── jobRoutes.js
│   │   │   ├── quotationRoutes.js
│   │   │   └── invoiceRoutes.js
│   │   └── services/             # Business logic
│   │       ├── clientService.js
│   │       ├── customerService.js
│   │       ├── jobService.js
│   │       ├── quotationService.js
│   │       └── invoiceService.js
│   ├── config/
│   │   └── database.js           # Database connection
│   ├── server.js                 # Express app entry
│   ├── package.json
│   └── .env                      # Environment variables (gitignored)
│
├── Database/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_repair_business.sql
│       └── 003_multi_client.sql
│
└── Configs/
    ├── .env.example              # Environment template
    └── .env                      # Actual env vars (gitignored)
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL 13+ (via Supabase)
- Git

### Environment Setup

1. **Copy environment templates:**
   ```bash
   cp Configs/.env.example Configs/.env
   cp Web/.env.example Web/.env.local
   ```

2. **Update `.env` files with your actual values:**
   ```bash
   # Configs/.env
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   SUPABASE_PROJECT_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-key
   JWT_SECRET=your-secret-key-change-this-in-production
   ```

3. **Run database migrations on Supabase:**
   - Go to Supabase Dashboard → SQL Editor
   - Run migrations in order:
     - `001_initial_schema.sql`
     - `002_repair_business.sql`
     - `003_multi_client.sql`

### Installation & Running

1. **Install dependencies:**
   ```bash
   # Backend
   cd API && npm install
   
   # Frontend
   cd ../Web && npm install
   ```

2. **Start the development servers:**
   ```bash
   # Terminal 1 - Backend (http://localhost:5000)
   cd API && npm run dev
   
   # Terminal 2 - Frontend (http://localhost:3000)
   cd Web && npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api
   - Health check: http://localhost:5000/api/health

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All endpoints (except `/health` and `/version`) require a Bearer token:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/clients
```

### Endpoints

#### Clients
- `GET /api/clients` - List user's clients
- `POST /api/clients` - Create new client
- `GET /api/clients/:id` - Get client details
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client (soft)
- `GET /api/clients/:id/stats` - Get client statistics

#### Customers
- `GET /api/customers?client_id=X` - List customers
- `POST /api/customers?client_id=X` - Create customer
- `GET /api/customers/:id?client_id=X` - Get customer
- `PUT /api/customers/:id?client_id=X` - Update customer
- `DELETE /api/customers/:id?client_id=X` - Delete customer (soft)
- `GET /api/customers/stats/overview?client_id=X` - Get stats
- `POST /api/customers/bulk?client_id=X` - Bulk import

#### Repair Jobs
- `GET /api/jobs?client_id=X` - List jobs
- `POST /api/jobs?client_id=X` - Create job
- `GET /api/jobs/:id?client_id=X` - Get job details
- `PUT /api/jobs/:id?client_id=X` - Update job status
- `DELETE /api/jobs/:id?client_id=X` - Delete job (soft)
- `GET /api/jobs/stats/overview?client_id=X` - Get job statistics

#### Quotations
- `GET /api/quotations?client_id=X` - List quotations
- `POST /api/quotations?client_id=X` - Create quotation
- `GET /api/quotations/:id?client_id=X` - Get quotation details
- `PUT /api/quotations/:id?client_id=X` - Update quotation
- `DELETE /api/quotations/:id?client_id=X` - Delete quotation (soft)
- `GET /api/quotations/stats/overview?client_id=X` - Get quotation statistics

#### Invoices
- `GET /api/invoices?client_id=X` - List invoices
- `POST /api/invoices?client_id=X` - Create invoice
- `GET /api/invoices/:id?client_id=X` - Get invoice details
- `PUT /api/invoices/:id?client_id=X` - Update invoice
- `DELETE /api/invoices/:id?client_id=X` - Delete invoice (soft)
- `GET /api/invoices/stats/overview?client_id=X` - Get invoice statistics

## Database Schema

### Key Tables

**clients**
- id (UUID, PK)
- name (string)
- business_type (string)
- subscription (enum: free, pro, enterprise)

**customers**
- id (UUID, PK)
- client_id (UUID, FK)
- name (string)
- phone (string)
- email (string)
- status (enum: new, contacted, booked, active, done, lost)
- source (enum: google, instagram, facebook, whatsapp, referral, walk_in)

**repair_jobs**
- id (UUID, PK)
- client_id (UUID, FK)
- customer_id (UUID, FK)
- appliance_type (string)
- status (enum: new, scheduled, inspected, quoted, approved, in_progress, completed)
- assigned_technician_id (UUID, FK)

**quotations**
- id (UUID, PK)
- client_id (UUID, FK)
- customer_id (UUID, FK)
- status (enum: pending, approved, rejected)
- created_at (timestamp)

**invoices**
- id (UUID, PK)
- client_id (UUID, FK)
- customer_id (UUID, FK)
- status (enum: draft, sent, paid, overdue)

## Development Workflow

### Creating a New Page
1. Create file in `Web/src/app/[feature]/page.tsx`
2. Create corresponding hook in `Web/src/hooks/use[Feature].ts`
3. Create API routes in `API/app/routes/[feature]Routes.js`
4. Create service in `API/app/services/[feature]Service.js`
5. Register routes in `API/server.js`

### Adding a New API Endpoint
1. Add method to service: `API/app/services/serviceService.js`
2. Add route in: `API/app/routes/featureRoutes.js`
3. Register in: `API/server.js`
4. Create/update hook: `Web/src/hooks/useFeature.ts`
5. Use hook in page: `Web/src/app/feature/page.tsx`

## Performance Considerations

- Row Level Security (RLS) prevents data cross-contamination
- Pagination limited to 100 rows per request
- Prepared statements prevent SQL injection
- JWT tokens for stateless API authentication
- Client-side caching via React state
- Database indexing on frequently queried fields

## Security

- ✅ JWT authentication on all protected endpoints
- ✅ Row Level Security (RLS) in Supabase
- ✅ Prepared SQL statements (no string concatenation)
- ✅ CORS enabled for localhost:3000
- ✅ Environment variables for sensitive data
- ✅ Soft deletes (is_active flag) for data recovery
- ⚠️ **TODO:** Add rate limiting
- ⚠️ **TODO:** Add request validation middleware
- ⚠️ **TODO:** Add audit logging

## Testing

```bash
# Frontend unit tests
cd Web && npm test

# Backend unit tests
cd API && npm test

# Integration tests (coming soon)
npm run test:integration
```

## Deployment

### Frontend (Next.js)
```bash
cd Web
npm run build
npm start
```

### Backend (Express)
```bash
cd API
NODE_ENV=production npm start
```

### Database
- Use Supabase managed PostgreSQL
- Auto-backups enabled
- SSL connection required in production

## Contributing

1. Create feature branch: `git checkout -b feature/description`
2. Commit changes: `git commit -am 'description'`
3. Push branch: `git push origin feature/description`
4. Open pull request

## License

Proprietary - Imran Pro Services

## Support

Email: imran.it.support@gmail.com

---

**Last Updated:** July 31, 2026  
**Version:** 1.0.0-beta

