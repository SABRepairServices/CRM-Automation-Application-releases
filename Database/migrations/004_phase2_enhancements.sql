-- ============================================================
-- 004_phase2_enhancements.sql
-- Phase 2: Social Media Posting & Account Management
-- Adds columns for social account multi-platform support
-- ============================================================

-- ─────────────────────────────────────────────
-- ALTER social_accounts — add token fields
-- Support OAuth tokens and refresh tokens
-- ─────────────────────────────────────────────
ALTER TABLE social_accounts
ADD COLUMN IF NOT EXISTS account_username VARCHAR(255),
ADD COLUMN IF NOT EXISTS access_token TEXT,
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_social_accounts_username ON social_accounts(account_username);
CREATE INDEX IF NOT EXISTS idx_social_accounts_expires_at ON social_accounts(expires_at);

-- ─────────────────────────────────────────────
-- ALTER posts — add social media fields
-- Connect posts to specific social accounts
-- Support multi-platform posting
-- ─────────────────────────────────────────────
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS social_account_id UUID REFERENCES social_accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS platforms TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_posts_social_account ON posts(social_account_id);
CREATE INDEX IF NOT EXISTS idx_posts_platforms ON posts USING GIN(platforms);
CREATE INDEX IF NOT EXISTS idx_posts_is_active ON posts(is_active);

-- ─────────────────────────────────────────────
-- ALTER engagement_metrics — add is_active
-- Soft delete support for engagement records
-- ─────────────────────────────────────────────
ALTER TABLE engagement_metrics
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- ─────────────────────────────────────────────
-- ALTER analytics_daily — add is_active
-- Soft delete support for daily analytics
-- ─────────────────────────────────────────────
ALTER TABLE analytics_daily
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- ─────────────────────────────────────────────
-- CREATE post_analytics table
-- Track real-time engagement per post
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  social_account_id UUID REFERENCES social_accounts(id) ON DELETE SET NULL,
  platform VARCHAR(50),
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  engagement_rate NUMERIC(5, 2),
  sentiment_score NUMERIC(3, 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_post_analytics_post_id ON post_analytics(post_id);
CREATE INDEX IF NOT EXISTS idx_post_analytics_social_account_id ON post_analytics(social_account_id);
CREATE INDEX IF NOT EXISTS idx_post_analytics_platform ON post_analytics(platform);
CREATE INDEX IF NOT EXISTS idx_post_analytics_is_active ON post_analytics(is_active);

-- ─────────────────────────────────────────────
-- VIEW: v_posts_with_accounts
-- Join posts with their social accounts for easy querying
-- ─────────────────────────────────────────────
CREATE OR REPLACE VIEW v_posts_with_accounts AS
SELECT
  p.id,
  p.client_id,
  p.content,
  p.media_urls,
  p.scheduled_at,
  p.published_at,
  p.status,
  p.platforms,
  p.is_active,
  sa.id AS account_id,
  sa.platform,
  sa.account_name,
  sa.account_username
FROM posts p
LEFT JOIN social_accounts sa ON p.social_account_id = sa.id
WHERE p.is_active = true;

-- ─────────────────────────────────────────────
-- VIEW: v_social_account_stats
-- Summary stats per social account
-- ─────────────────────────────────────────────
CREATE OR REPLACE VIEW v_social_account_stats AS
SELECT
  sa.id,
  sa.client_id,
  sa.platform,
  sa.account_name,
  COUNT(DISTINCT p.id) AS posts_count,
  COUNT(DISTINCT CASE WHEN p.status = 'published' THEN p.id END) AS published_posts,
  COUNT(DISTINCT CASE WHEN p.status = 'scheduled' THEN p.id END) AS scheduled_posts,
  COUNT(DISTINCT CASE WHEN p.status = 'draft' THEN p.id END) AS draft_posts,
  COALESCE(SUM(pa.impressions), 0) AS total_impressions,
  COALESCE(SUM(pa.engagement_rate), 0) AS total_engagement
FROM social_accounts sa
LEFT JOIN posts p ON sa.id = p.social_account_id AND p.is_active = true
LEFT JOIN post_analytics pa ON p.id = pa.post_id AND pa.is_active = true
WHERE sa.is_active = true
GROUP BY sa.id, sa.client_id, sa.platform, sa.account_name;
