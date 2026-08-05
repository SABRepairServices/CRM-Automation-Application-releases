-- ============================================================
-- 009_social_posting.sql
-- Real platform publishing needs somewhere to record what actually
-- happened: the external post ID/URL Meta returns on success, or the
-- error message on failure — so a failed publish is visible in the UI
-- instead of silently doing nothing.
-- ============================================================

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS platform_post_id TEXT,
  ADD COLUMN IF NOT EXISTS platform_url TEXT,
  ADD COLUMN IF NOT EXISTS error_message TEXT;
