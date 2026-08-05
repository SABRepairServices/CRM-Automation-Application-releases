# Database Setup Guide - Imran Pro Services

Complete guide to setting up the database and running migrations.

## Prerequisites

- Supabase account (free at https://supabase.com)
- PostgreSQL client (optional, for local testing)
- SQL editor access (Supabase UI or pgAdmin)

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign up
2. Click "New Project"
3. Enter project name: `imran-pro-services`
4. Choose region closest to you
5. Set a strong database password
6. Click "Create new project"

## Step 2: Get Database Credentials

1. Go to Project Settings → Database
2. Copy these values:
   - **Host:** db.xxx.supabase.co
   - **Port:** 5432
   - **Database:** postgres
   - **User:** postgres
   - **Password:** (your chosen password)

3. Format as DATABASE_URL:
   ```
   postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```

## Step 3: Update .env Files

### Configs/.env
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres
SUPABASE_PROJECT_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
JWT_SECRET=your_jwt_secret_here
```

### Web/.env.local
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=Imran Pro Services
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## Step 4: Run Migrations

### Option A: Using Supabase SQL Editor (Recommended)

1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy-paste the contents of each migration file in order:
   - Database/migrations/001_initial_schema.sql
   - Database/migrations/002_repair_business.sql
   - Database/migrations/003_multi_client.sql
   - Database/migrations/004_phase2_enhancements.sql

4. Run each query (click "Run" button)
5. Verify success (check for "Success" message)

### Option B: Using psql Command Line

```bash
# Install PostgreSQL client if needed (Windows)
# Download from https://www.postgresql.org/download/windows/

# Connect to database
psql -h db.xxx.supabase.co -U postgres -d postgres -p 5432

# Enter password when prompted

# Run migrations
\i D:/Developer\ Application/Social-Media-Automation/Database/migrations/001_initial_schema.sql
\i D:/Developer\ Application/Social-Media-Automation/Database/migrations/002_repair_business.sql
\i D:/Developer\ Application/Social-Media-Automation/Database/migrations/003_multi_client.sql
\i D:/Developer\ Application/Social-Media-Automation/Database/migrations/004_phase2_enhancements.sql

# Exit
\q
```

## Step 5: Verify Database Setup

### Using Supabase UI

1. Go to Supabase → Table Editor
2. Verify these tables exist:
   - users
   - clients
   - customers
   - repair_jobs
   - quotations
   - invoices
   - technicians
   - social_accounts
   - posts
   - post_analytics
   - analytics_daily
   - engagement_metrics
   - ai_generations

### Using SQL Query

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

## Step 6: Enable Row Level Security (RLS)

For production, enable RLS on tables:

```sql
-- Enable RLS on key tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (see SECURITY.md)
```

## Step 7: Create Test Data

```sql
-- Create a test user
INSERT INTO users (email, password_hash, full_name, role)
VALUES (
  'admin@imranpro.com',
  'hashed_password_here',
  'Admin User',
  'admin'
);

-- Create a test client
INSERT INTO clients (user_id, name, business_type, industry)
VALUES (
  (SELECT id FROM users WHERE email = 'admin@imranpro.com'),
  'Imran Pro Services',
  'Repair Services',
  'Electronics'
);

-- Create a test social account
INSERT INTO social_accounts (client_id, platform, account_name, account_username, is_active)
VALUES (
  (SELECT id FROM clients WHERE name = 'Imran Pro Services'),
  'facebook',
  'Imran Pro Services',
  'imranpro',
  true
);
```

## Step 8: Verify API Connection

Start the backend:

```bash
cd API
npm install
npm run dev
```

Test connection:

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2026-07-31T10:00:00Z",
  "uptime": 1.234,
  "environment": "development"
}
```

## Step 9: Start Frontend

```bash
cd Web
npm install
npm run dev
```

Access at: http://localhost:3000

## Troubleshooting

### "Connection refused" error
- Verify DATABASE_URL is correct
- Check internet connection
- Ensure Supabase project is active

### "Syntax error" in migrations
- Copy migrations one at a time
- Ensure no double copying
- Check for special characters

### Tables not appearing
- Refresh Supabase dashboard
- Check table_schema is 'public'
- Verify migration ran without errors

### Permission denied errors
- Ensure postgres user has full permissions
- May need to modify RLS policies
- Contact Supabase support if issue persists

## Database Backup

### Automatic Backups (Supabase)
- Enabled by default
- Daily automated backups
- 14-day retention
- Access via Project Settings → Database

### Manual Backup

```bash
# Dump database
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql

# Restore database
psql -h db.xxx.supabase.co -U postgres -d postgres < backup.sql
```

## Next Steps

1. ✅ Database is ready
2. → Run backend server (npm run dev in API/)
3. → Run frontend (npm run dev in Web/)
4. → Create first client in dashboard
5. → Connect social media accounts
6. → Start posting!

## Documentation

- **Schema:** See Database/migrations/
- **Security:** See SECURITY.md
- **API Reference:** See Docs/API_ENDPOINTS.md
- **Architecture:** See ARCHITECTURE.md

## Support

For database issues:
- Check Supabase status: https://status.supabase.com
- Review error messages in Supabase logs
- Check API server logs
- Email: imran.it.support@gmail.com
