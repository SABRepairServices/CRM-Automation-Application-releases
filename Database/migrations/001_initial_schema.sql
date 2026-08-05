-- ============================================================
-- Social Media Automation - Initial Database Schema
-- ============================================================

-- ============================================================
-- USERS & AUTHENTICATION
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'user',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- ============================================================
-- USER PREFERENCES
-- ============================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'light',
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'en',
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- ============================================================
-- SOCIAL ACCOUNTS
-- ============================================================

CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  profile_id VARCHAR(255),
  profile_url TEXT,
  profile_image_url TEXT,
  followers_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'connected',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_social_accounts_user_id ON social_accounts(user_id);
CREATE INDEX idx_social_accounts_platform ON social_accounts(platform);
CREATE INDEX idx_social_accounts_status ON social_accounts(status);

-- ============================================================
-- ACCOUNT CREDENTIALS (Encrypted)
-- ============================================================

CREATE TABLE IF NOT EXISTS account_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES social_accounts(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type VARCHAR(50),
  expires_at TIMESTAMP,
  scopes TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(account_id)
);

-- ============================================================
-- POSTS & CONTENT
-- ============================================================

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[],
  scheduled_at TIMESTAMP,
  published_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'draft',
  content_type VARCHAR(50) DEFAULT 'text',
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scheduled_at ON posts(scheduled_at);
CREATE INDEX idx_posts_published_at ON posts(published_at);

-- ============================================================
-- POST PLATFORMS (Which platform each post is for)
-- ============================================================

CREATE TABLE IF NOT EXISTS post_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  account_id UUID REFERENCES social_accounts(id),
  platform VARCHAR(50) NOT NULL,
  platform_post_id VARCHAR(255),
  platform_url TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  published_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_post_platforms_post_id ON post_platforms(post_id);
CREATE INDEX idx_post_platforms_platform ON post_platforms(platform);
CREATE INDEX idx_post_platforms_status ON post_platforms(status);

-- ============================================================
-- ANALYTICS - DAILY METRICS
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES social_accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  followers_count INTEGER,
  likes_count INTEGER,
  comments_count INTEGER,
  shares_count INTEGER,
  impressions INTEGER,
  reach INTEGER,
  engagement_rate NUMERIC(5, 2),
  metrics_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(account_id, date)
);

CREATE INDEX idx_analytics_daily_account_id ON analytics_daily(account_id);
CREATE INDEX idx_analytics_daily_date ON analytics_daily(date);

-- ============================================================
-- ENGAGEMENT METRICS - PER POST
-- ============================================================

CREATE TABLE IF NOT EXISTS engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement_rate NUMERIC(5, 2),
  sentiment_score NUMERIC(3, 2),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_engagement_metrics_post_id ON engagement_metrics(post_id);
CREATE INDEX idx_engagement_metrics_platform ON engagement_metrics(platform);

-- ============================================================
-- AI GENERATIONS CACHE
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  output TEXT NOT NULL,
  model VARCHAR(100) DEFAULT 'claude-sonnet-4-6',
  tokens_used INTEGER,
  generation_type VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_generations_user_id ON ai_generations(user_id);
CREATE INDEX idx_ai_generations_created_at ON ai_generations(created_at);

-- ============================================================
-- JOBS / BACKGROUND TASKS QUEUE
-- ============================================================

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  payload JSONB,
  result JSONB,
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_job_type ON jobs(job_type);
CREATE INDEX idx_jobs_scheduled_at ON jobs(scheduled_at);

-- ============================================================
-- JOB LOGS / DEBUGGING
-- ============================================================

CREATE TABLE IF NOT EXISTS job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  log_level VARCHAR(20),
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_job_logs_job_id ON job_logs(job_id);

-- ============================================================
-- API AUDIT LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  method VARCHAR(10),
  endpoint VARCHAR(255),
  status_code INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_logs_user_id ON api_logs(user_id);
CREATE INDEX idx_api_logs_created_at ON api_logs(created_at);

-- ============================================================
-- GRANT PERMISSIONS (For Supabase)
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Row Level Security Policies
-- ============================================================

-- Users can only see their own data
CREATE POLICY "Users can only access their own data" ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can only access their own social accounts" ON social_accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own posts" ON posts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own analytics" ON analytics_daily
  FOR ALL USING (EXISTS (
    SELECT 1 FROM social_accounts WHERE social_accounts.id = account_id AND social_accounts.user_id = auth.uid()
  ));

-- ============================================================
-- SCHEMA COMPLETE
-- ============================================================

-- Timestamp: 2026-07-30
-- Version: 1.0.0
-- Status: Ready for production
