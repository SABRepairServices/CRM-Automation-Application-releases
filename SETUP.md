# Setup Guide - Imran Pro Services CRM

Complete step-by-step setup instructions for development and production environments.

## Development Setup (Local Machine)

### 1. Prerequisites Check
```bash
# Check Node.js version (need v18+)
node --version

# Check npm version
npm --version

# Check git
git --version
```

### 2. Clone & Navigate
```bash
cd "D:\Developer Application\Social-Media-Automation"
```

### 3. Supabase Project Setup

1. **Create Supabase Project:**
   - Go to https://supabase.com
   - Click "New Project"
   - Choose region (closer = faster)
   - Set password (save securely)
   - Wait for project to be ready

2. **Get Credentials:**
   - Click "Settings" → "API"
   - Copy these values:
     - Project URL → `SUPABASE_PROJECT_URL`
     - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY`
     - Anon Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Run Database Migrations:**
   - In Supabase Dashboard, go to "SQL Editor"
   - Click "New query"
   - Copy & paste contents of `Database/migrations/001_initial_schema.sql`
   - Click "Run"
   - Repeat for `002_repair_business.sql` and `003_multi_client.sql`

4. **Enable Row Level Security (RLS):**
   - Go to "Auth" → "Policies"
   - For each table (customers, jobs, quotations, invoices):
     - Click table name
     - Create policies for SELECT/INSERT/UPDATE/DELETE
     - Condition: `auth.uid() = user_id` OR `client_id = user_id`

### 4. Environment Configuration

1. **Backend `.env`:**
   ```bash
   cd Configs
   # Copy template
   cp .env.example .env
   
   # Edit .env with your editor
   # Fill in these values:
   DATABASE_URL=postgresql://[user]:[password]@[host]:5432/[database]
   SUPABASE_PROJECT_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5...
   JWT_SECRET=your-super-secret-key-change-in-production
   NODE_ENV=development
   API_PORT=5000
   ```

2. **Frontend `.env.local`:**
   ```bash
   cd Web
   cp .env.example .env.local
   
   # Edit .env.local
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_APP_NAME=Imran Pro Services
   NEXT_PUBLIC_APP_VERSION=1.0.0
   ```

### 5. Install Dependencies

```bash
# Terminal 1: Backend
cd API
npm install

# Terminal 2: Frontend
cd Web
npm install
```

### 6. Start Development Servers

```bash
# Terminal 1: Backend (runs on http://localhost:5000)
cd API
npm run dev

# You should see:
# ✅ Server running on http://0.0.0.0:5000
# ✅ Database Configuration: ✅ Configured

# Terminal 2: Frontend (runs on http://localhost:3000)
cd Web
npm run dev

# You should see:
# ✅ compiled client and server successfully
# ➜ Local: http://localhost:3000
```

### 7. Verify Installation

1. **Backend Health:**
   ```bash
   curl http://localhost:5000/api/health
   # Response: {"status":"OK","timestamp":"...","uptime":...}
   ```

2. **Frontend:**
   - Open http://localhost:3000
   - Should redirect to dashboard
   - You'll see "No client selected" - this is normal

3. **Create First Client:**
   - Click "Clients" in sidebar
   - Click "+ Add Client"
   - Fill in name and click "Create Client"
   - Select it from dropdown - now you can add customers/jobs

## Production Deployment

### 1. Build Frontend
```bash
cd Web
npm run build
# Creates optimized build in .next/

npm start
# Starts production server
```

### 2. Build Backend
```bash
cd API
# Ensure NODE_ENV=production in .env
npm start
# Starts production server
```

### 3. Environment Variables (Production)

Create `.env` with production values:
```bash
# Database - use managed Supabase with SSL
DATABASE_URL=postgresql://postgres:[password]@db.xxxx.supabase.co:5432/postgres?sslmode=require

# Security
JWT_SECRET=[use 32+ char random string, NOT your dev key]
NODE_ENV=production

# API
API_PORT=5000
API_HOST=0.0.0.0
CORS_ORIGIN=https://yourdomain.com

# Supabase (use service role)
SUPABASE_PROJECT_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[use production key]
```

### 4. Deployment Platforms

#### Option A: Vercel (Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from Web directory
cd Web
vercel --prod
```

#### Option B: Railway (Backend + Database)
1. Create Railway account
2. Connect GitHub repo
3. Add Supabase as data source
4. Deploy Express app
5. Set environment variables in Railway dashboard

#### Option C: Docker (Self-hosted)

Create `Dockerfile` in root:
```dockerfile
FROM node:18

WORKDIR /app

# Copy both directories
COPY API ./API
COPY Web ./Web

# Install dependencies
RUN cd API && npm ci
RUN cd Web && npm ci

# Build frontend
RUN cd Web && npm run build

EXPOSE 3000 5000

CMD ["sh", "-c", "cd API && npm start & cd Web && npm start"]
```

```bash
docker build -t ips-crm .
docker run -p 3000:3000 -p 5000:5000 --env-file .env ips-crm
```

## Troubleshooting

### "Cannot find module 'pg'"
```bash
cd API
npm install pg
```

### "Database Configuration: ❌ Missing"
- Check `Configs/.env` exists
- Verify `DATABASE_URL` is set correctly
- Make sure `SUPABASE_PROJECT_URL` is present

### "CORS error" in frontend
- Backend running? Check `http://localhost:5000/api/health`
- `CORS_ORIGIN` in `.env` matches frontend URL
- Browser console shows exact error - note it

### "No customers showing up"
- Selected a client? Use ClientSelector dropdown
- That client has customers? Go to Customers page to add
- Client ID stored in localStorage? Check DevTools → Application → localStorage

### "Port 5000 already in use"
```bash
# Find what's using port
netstat -ano | findstr :5000

# Kill the process
taskkill /PID [PID] /F

# Or use different port in .env
API_PORT=5001
```

### "Token invalid or expired"
- Check `.env` `JWT_SECRET` - must match across restarts
- For dev: use any value, it's just signing
- For prod: use strong random value, keep consistent

## Testing the System

### 1. Create a Test Client
- Dashboard → Clients
- Add "Test Business"
- Select it from dropdown

### 2. Add Test Customers
- Customers → + Add Customer
- Create 3-5 test customers
- Verify stats on dashboard update

### 3. Create Test Jobs
- Jobs → + New Job
- Select a customer
- Set appliance type: "AC"
- Add description
- Verify appears in list

### 4. Add Quotation
- Quotes → + New Quote
- Select customer
- Add line items (Labour, Parts, etc.)
- Total should calculate

### 5. Create Invoice
- Invoices → + New Invoice
- Select customer
- Set dates
- Should link to jobs

## Performance Testing

### Load Testing
```bash
# Using Apache Bench
ab -n 100 -c 10 http://localhost:5000/api/health

# Using wrk
wrk -t12 -c400 -d30s http://localhost:5000/api/health
```

### Database Performance
```bash
# Check slow queries (in Supabase)
SELECT * FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;
```

## Backup & Recovery

### Database Backup
- Supabase handles automatic daily backups
- Manual backup: Supabase Dashboard → "Backups"
- Download as SQL or use "Restore from backup"

### Data Export
```bash
# Export all customers as CSV
# Via Supabase Dashboard → Table Editor
# Right-click table → Export as CSV
```

## Security Checklist

- [ ] Changed `JWT_SECRET` from default
- [ ] Set `NODE_ENV=production` in prod
- [ ] Enable HTTPS (required for production)
- [ ] Set `CORS_ORIGIN` to actual domain
- [ ] Enable database SSL connection
- [ ] Remove database password from logs
- [ ] Set up rate limiting middleware
- [ ] Enable API request validation
- [ ] Configure firewall rules
- [ ] Set up error monitoring (Sentry)
- [ ] Enable audit logging
- [ ] Rotate API keys periodically

## Monitoring

### Logs
```bash
# Backend logs
cd API && npm run dev 2>&1 | tee app.log

# View in real-time
tail -f app.log
```

### Database
- Supabase Dashboard → "Logs"
- Filter by queries, errors, or slowness

### Frontend Errors
- Browser DevTools → Console
- Sentry integration (coming soon)

---

**Support:** imran.it.support@gmail.com
