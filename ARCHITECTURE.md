# System Architecture - Imran Pro Services CRM

## Overview

Imran Pro Services is a **multi-tenant SaaS** business management platform built with modern web technologies. It supports complete lifecycle management for repair businesses including customer CRM, job scheduling, quotations, invoicing, and social media automation.

### Core Principles
- **Multi-tenancy:** Multiple businesses in single instance, isolated by `client_id`
- **Security:** JWT authentication + Row Level Security (RLS) in database
- **Scalability:** Stateless API, database-driven business logic
- **Separation of Concerns:** Service layer handles logic, routes handle HTTP
- **Type Safety:** TypeScript on frontend, prepared statements on backend

## Technology Stack Decision Matrix

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend Framework** | Next.js 14 | Built-in routing, SSR ready, React ecosystem |
| **Frontend Language** | TypeScript | Type safety, better IDE support, catches bugs early |
| **Frontend Styling** | Tailwind CSS | Utility-first, rapid prototyping, consistent design |
| **Frontend State** | React Context + Hooks | Minimal dependencies, sufficient for current scale |
| **Backend Framework** | Express.js | Lightweight, minimal boilerplate, flexible middleware |
| **Backend Language** | JavaScript/Node.js | Shared language with frontend, rapid iteration |
| **Database** | PostgreSQL | ACID compliance, JSON support, RLS for multi-tenancy |
| **Database Provider** | Supabase | Managed PostgreSQL, built-in auth, RLS policies |
| **Authentication** | JWT Bearer tokens | Stateless, API-friendly, industry standard |
| **HTTP Client** | Axios | Promise-based, request/response interceptors |

## Data Model & Multi-Tenancy

### Tenancy Model: Row-Level Isolation

Every business entity includes `client_id` foreign key:
```
clients (parent)
  ├── users (owns client)
  ├── customers (client_id)
  ├── repair_jobs (client_id)
  ├── quotations (client_id)
  ├── invoices (client_id)
  ├── technicians (client_id)
  └── social_accounts (client_id)
```

### Security Implementation

1. **Application Layer:**
   - All queries include `WHERE client_id = $1`
   - Query params require `client_id` from request

2. **Database Layer (RLS):**
   ```sql
   ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
   CREATE POLICY customer_isolation ON customers
   USING (client_id = current_user_id());
   ```

3. **Token Layer:**
   - JWT includes `user_id` and optionally `client_id`
   - API validates `client_id` matches token

## API Architecture

### Request/Response Flow

```
Request
  ↓
[Express Middleware Chain]
  - CORS validation
  - Body parsing
  - Request logging
  ↓
[Route Handler]
  - Validate required params
  - Extract client_id from query
  ↓
[Service Layer]
  - Business logic
  - Database queries (with client_id)
  - Error handling
  ↓
[Response]
  - JSON: { data: [...], error: null }
  - or: { data: null, error: "message" }
```

### API Design Patterns

#### Multi-Client Query Parameter
All endpoints require `client_id` query parameter:
```
GET /api/customers?client_id=uuid
GET /api/jobs?client_id=uuid&status=completed
```

#### Standard Response Format
```json
{
  "data": [...],        // Array or single object
  "error": null,        // null on success, error message on failure
  "timestamp": "2026-07-31T..."
}
```

#### Soft Deletes
Instead of `DELETE FROM`, use:
```sql
UPDATE table SET is_active = false, updated_at = NOW() WHERE id = $1
```
This preserves audit trail and enables recovery.

#### Pagination
Requests default to 100 rows max. For large datasets:
- Add `LIMIT 100` to queries
- Return `page`, `total`, `hasMore` in response
- Client requests next page: `?page=2`

## Frontend Architecture

### Page Structure

Each feature has consistent pattern:
```
Web/src/app/[feature]/page.tsx
├── Import hook (useFeature)
├── Import ClientSelector
├── State: clientId, formData, selectedId
├── useEffect: load data when clientId changes
├── Handlers: handleSubmit, handleDelete, handleEdit
└── JSX: ClientSelector + Form + Table/Grid
```

### Hook Pattern

All hooks follow same structure:
```typescript
export const useFeature = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const listItems = useCallback(async (options?) => {
    // Fetch from API with client_id
  }, [])
  
  const createItem = useCallback(async (data, clientId?) => {
    // Create and add to state
  }, [items])
  
  return { items, loading, error, listItems, createItem, ... }
}
```

Key points:
- No client_id in hook constructor (use localStorage)
- All methods accept optional clientId parameter
- State updates use spread operator for immutability
- Error state as string, not objects

### Component Reusability

**ClientSelector** appears on every page:
- Reads from localStorage → `selectedClientId`
- Syncs across tabs via storage events (not yet implemented)
- Dropdown filters data client-side, not server-side
- Every hook respects selected client

## Backend Service Layer

### Service File Pattern

```javascript
// service file contains pure business logic
const listItems = async (clientId, filters) => {
  // Build query
  let query = `SELECT * FROM table WHERE client_id = $1`
  let params = [clientId]
  
  // Add filters
  if (filters.status) {
    query += ` AND status = $${params.length + 1}`
    params.push(filters.status)
  }
  
  // Execute
  const result = await db.query(query, params)
  return result.rows
}

module.exports = { listItems, createItem, ... }
```

Key patterns:
- Always include `client_id` in WHERE clause
- Prepared statements prevent SQL injection
- Dynamic query building for optional filters
- Return raw rows (routes handle JSON conversion)

### Route File Pattern

```javascript
const router = express.Router()
const authenticate = require('../middleware/authenticate')
const { listItems, createItem } = require('../services/itemService')

router.get('/', authenticate, async (req, res) => {
  try {
    const { client_id } = req.query  // Always require
    if (!client_id) return res.status(400).json({ error: 'client_id required' })
    
    const items = await listItems(client_id, filters)
    res.json({ data: items })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
```

Key patterns:
- All routes use `authenticate` middleware
- Require `client_id` from query string
- Try/catch wraps async operations
- Return `{ data: ... }` or `{ error: ... }`

## Database Schema Design

### Core Tables Structure

Each table follows pattern:
```sql
CREATE TABLE table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  [feature-specific fields],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_table_client ON table_name(client_id);
CREATE INDEX idx_table_active ON table_name(is_active);
```

### Relationships

- Foreign keys to `clients` on all business tables
- Foreign keys to `customers` for jobs/quotes/invoices
- Foreign keys to `jobs` for quotations/invoices
- No direct user-to-table relationships (through clients)

### Audit Trail

`job_activity` table tracks all job status changes:
```sql
CREATE TABLE job_activity (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES repair_jobs(id),
  old_status VARCHAR,
  new_status VARCHAR,
  changed_at TIMESTAMP,
  changed_by UUID
);
```

## Performance Optimization

### Database Level
- Indexes on `client_id` for fast filtering
- Prepared statements prevent parsing overhead
- Queries use `LIMIT 100` by default
- Soft deletes add `WHERE is_active = true` to all queries

### API Level
- Compression middleware enabled
- CORS configured to allow browser caching
- No N+1 queries (joins in single query when needed)
- Response data shaped in SQL, not post-processing

### Frontend Level
- React hooks memoization with useCallback
- Lazy loading via next/dynamic (not yet implemented)
- Client-side filtering before re-renders
- localStorage for client selection (avoid network)

## Error Handling Strategy

### Layers

1. **Frontend (Hook Level):**
   - Wrap try/catch around axios calls
   - Set `error` state as string
   - Components display `{error && <div>{error}</div>}`

2. **Backend (Route Level):**
   - Wrap `await` in try/catch
   - Return `{ error: err.message }` on any exception
   - Don't expose stack traces in production

3. **Database Level:**
   - Prepared statements prevent SQL injection
   - NOT NULL constraints caught as DB errors
   - Foreign key constraints return meaningful messages

### Error Types & Handling

| Error | HTTP | Response | User Sees |
|-------|------|----------|-----------|
| Missing client_id | 400 | Bad Request | "Please select a client" |
| Unauthorized | 401 | Unauthorized | Redirect to login |
| Resource not found | 404 | Not Found | "Item not found" |
| Conflict (FK violation) | 409 | Conflict | "Can't delete, in use elsewhere" |
| Server error | 500 | Internal Server Error | "Something went wrong" |

## Authentication & Authorization

### Current Implementation
- Simple Bearer token in Authorization header
- No token validation (accept any valid JWT format)
- User ID extracted from token (not verified)

### Future Implementation
- Proper JWT signing with RS256
- Token expiration & refresh tokens
- Role-based access control (admin, manager, technician)
- API key support for integrations

### RLS Policies
```sql
-- Example: customers table
CREATE POLICY select_own_customers ON customers
  FOR SELECT
  USING (auth.uid() = client_id::uuid);
```

## Scaling Considerations

### Current Limits (Single Server)
- Max 1000 concurrent users
- ~1000 requests/second (Express default)
- 50k records per table before indexes matter
- ~1GB database size

### Scaling Path
1. **Database:** Supabase handles auto-scaling
2. **API:** Horizontal scaling (multiple Node instances)
3. **Frontend:** Vercel edge network
4. **Cache:** Redis for session/client selection (not yet)
5. **Queue:** Bull for async jobs like email (not yet)

### Monitoring (Future)
- APM: Datadog or New Relic
- Logs: Supabase logs + Papertrail
- Errors: Sentry for frontend & backend
- Database: Supabase dashboard metrics

## Deployment Architecture

### Development
```
Laptop
  ├── Frontend: localhost:3000 (next dev)
  ├── Backend: localhost:5000 (express dev)
  └── Database: Supabase cloud (remote)
```

### Production
```
vercel.com (Frontend)
  ↓ (API calls)
railway.app (Backend Express)
  ↓ (SQL queries)
supabase.co (PostgreSQL)
```

### Environment Parity
- Dev, staging, prod use same code
- Only `.env` differs (database URL, secrets)
- Migrations run on all environments

## Testing Strategy (Not Yet Implemented)

### Frontend Tests
```typescript
// useCustomers.test.ts
describe('useCustomers', () => {
  it('should list customers with client_id', () => {})
  it('should create and add to state', () => {})
  it('should handle errors gracefully', () => {})
})
```

### Backend Tests
```javascript
// customerService.test.js
describe('customerService', () => {
  it('should list customers filtered by client_id', () => {})
  it('should not list deleted customers', () => {})
})
```

### Integration Tests
- Start both servers
- Create test client in DB
- API calls with real database
- Assert response structure & data

## Security Audit Checklist

- [ ] JWT_SECRET changed from default
- [ ] All queries use parameterized statements
- [ ] RLS policies enabled on all tables
- [ ] HTTPS required in production
- [ ] CORS restricted to origin domain
- [ ] Rate limiting on authentication endpoints
- [ ] No secrets in error messages
- [ ] Database connection uses SSL
- [ ] API keys rotated monthly
- [ ] Audit logs for sensitive operations
- [ ] PII encrypted at rest
- [ ] Payment data PCI-compliant (if applicable)

## Documentation Maps

| Document | Purpose |
|----------|---------|
| **README.md** | Feature overview, quick start, API reference |
| **SETUP.md** | Step-by-step installation & troubleshooting |
| **ARCHITECTURE.md** | System design, patterns, scaling (this file) |
| **Code Comments** | WHY decisions, not WHAT code does |
| **Git Commits** | Link to issues, explain non-obvious changes |

---

**Revision:** 1.0  
**Last Updated:** July 31, 2026  
**Maintainer:** Imran Pro Services
