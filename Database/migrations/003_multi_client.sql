-- ============================================================
-- 003_multi_client.sql
-- Multi-client support - one app, many businesses
-- Adds clients table + links social_accounts to client
-- ============================================================

-- ─────────────────────────────────────────────
-- CLIENTS — businesses using the platform
-- Blueprint: Imran Pro Services = one client
-- Later: Shams AL Barakats = another client
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(200) NOT NULL,
  business_type   VARCHAR(100),
  industry        VARCHAR(100),
  website         VARCHAR(255),
  email           VARCHAR(200),
  phone           VARCHAR(30),
  address         TEXT,
  city            VARCHAR(100),
  country         VARCHAR(100),
  logo_url        TEXT,
  brand_color     VARCHAR(7),      -- hex color #RRGGBB
  is_active       BOOLEAN DEFAULT TRUE,
  subscription    VARCHAR(50) DEFAULT 'free',
  billing_email   VARCHAR(200),
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clients_user    ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_active  ON clients(is_active);

-- ─────────────────────────────────────────────
-- ALTER social_accounts — add client_id
-- Now posts belong to a client, not just a user
-- ─────────────────────────────────────────────
ALTER TABLE social_accounts
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_social_accounts_client ON social_accounts(client_id);

-- ─────────────────────────────────────────────
-- ALTER posts — add client_id
-- ─────────────────────────────────────────────
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_posts_client ON posts(client_id);

-- ─────────────────────────────────────────────
-- ALTER repair_jobs — add client_id
-- (some clients may use repair workflow)
-- ─────────────────────────────────────────────
ALTER TABLE repair_jobs
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_repair_jobs_client ON repair_jobs(client_id);

-- ─────────────────────────────────────────────
-- updated_at trigger for clients
-- ─────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_clients_touch ON clients;

CREATE TRIGGER trg_clients_touch BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─────────────────────────────────────────────
-- VIEW: user's clients with account counts
-- Used by dashboard to show "you manage X clients"
-- ─────────────────────────────────────────────
CREATE OR REPLACE VIEW v_user_clients AS
SELECT
  c.id,
  c.name,
  c.business_type,
  c.is_active,
  COUNT(DISTINCT sa.id) AS social_accounts_count,
  COUNT(DISTINCT p.id)  AS posts_count,
  MAX(p.created_at)     AS last_post_at
FROM clients c
LEFT JOIN social_accounts sa ON sa.client_id = c.id
LEFT JOIN posts p             ON p.client_id = c.id
GROUP BY c.id, c.name, c.business_type, c.is_active;
