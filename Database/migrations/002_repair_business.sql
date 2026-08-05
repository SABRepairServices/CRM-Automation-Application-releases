-- ============================================================
-- 002_repair_business.sql
-- Shams AL Barakats — appliance repair workflow
-- Covers blueprint Phase 3 (leads), 4 (jobs), 5 (invoicing)
--
-- Runs AFTER 001_initial_schema.sql (needs users table).
-- Does not modify any table from 001.
--
-- NOTE: 001 already has a `jobs` table = background queue.
-- Repair work is `repair_jobs` here. Different thing, kept apart.
-- ============================================================

-- ─────────────────────────────────────────────
-- CONTRACTS — companies on monthly agreement
-- Walk-in customers have no contract (NULL).
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name    VARCHAR(200) NOT NULL,
  contact_person  VARCHAR(150),
  phone           VARCHAR(30),
  email           VARCHAR(200),
  address         TEXT,
  area            VARCHAR(120),
  billing_cycle   VARCHAR(20)  DEFAULT 'monthly',
  payment_terms   INTEGER      DEFAULT 30,   -- days until due
  is_active       BOOLEAN      DEFAULT TRUE,
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- CUSTOMERS — every person who contacts us
-- Blueprint Phase 3. Replaces the Airtable base.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id  UUID REFERENCES contracts(id) ON DELETE SET NULL,
  name         VARCHAR(150) NOT NULL,
  phone        VARCHAR(30)  NOT NULL,
  whatsapp     VARCHAR(30),
  email        VARCHAR(200),
  area         VARCHAR(120),
  address      TEXT,
  -- where they came from: google, instagram, facebook, tiktok,
  -- whatsapp, referral, walk_in, repeat
  source       VARCHAR(50)  DEFAULT 'unknown',
  status       VARCHAR(30)  DEFAULT 'new',
  notes        TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT customers_status_chk
    CHECK (status IN ('new','contacted','booked','active','done','lost'))
);

CREATE INDEX IF NOT EXISTS idx_customers_phone    ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_status   ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_contract ON customers(contract_id);
CREATE INDEX IF NOT EXISTS idx_customers_source   ON customers(source);

-- ─────────────────────────────────────────────
-- TECHNICIANS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS technicians (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  name       VARCHAR(150) NOT NULL,
  phone      VARCHAR(30),
  speciality VARCHAR(120),          -- ac, washing_machine, fridge, oven
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- REPAIR_JOBS — one visit / one appliance
-- Blueprint Phase 4.
-- job_number is human-readable for WhatsApp: SAB-2026-0001
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS repair_jobs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number     VARCHAR(40) UNIQUE NOT NULL,
  customer_id    UUID NOT NULL REFERENCES customers(id)   ON DELETE RESTRICT,
  contract_id    UUID          REFERENCES contracts(id)   ON DELETE SET NULL,
  technician_id  UUID          REFERENCES technicians(id) ON DELETE SET NULL,

  appliance_type VARCHAR(80),   -- washing_machine, ac, fridge, oven, dishwasher
  brand          VARCHAR(80),
  model          VARCHAR(120),
  serial_number  VARCHAR(120),

  reported_fault TEXT,          -- what customer said
  diagnosis      TEXT,          -- what technician found

  status         VARCHAR(30) DEFAULT 'new',
  priority       VARCHAR(20) DEFAULT 'normal',

  scheduled_at   TIMESTAMP,
  visited_at     TIMESTAMP,
  completed_at   TIMESTAMP,

  warranty_days  INTEGER DEFAULT 0,
  notes          TEXT,

  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT repair_jobs_status_chk CHECK (status IN (
    'new','scheduled','inspected','quoted','approved',
    'rejected','in_progress','completed','cancelled'
  )),
  CONSTRAINT repair_jobs_priority_chk
    CHECK (priority IN ('low','normal','urgent'))
);

CREATE INDEX IF NOT EXISTS idx_jobs_customer  ON repair_jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_contract  ON repair_jobs(contract_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status    ON repair_jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled ON repair_jobs(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_jobs_number    ON repair_jobs(job_number);

-- ─────────────────────────────────────────────
-- JOB_PHOTOS — technician WhatsApp photos
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID NOT NULL REFERENCES repair_jobs(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  -- before, after, serial_plate, fault, part
  photo_type  VARCHAR(30) DEFAULT 'other',
  caption     TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_photos_job ON job_photos(job_id);

-- ─────────────────────────────────────────────
-- QUOTATIONS — priced offer sent to customer
-- One job may get several (revised price).
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number VARCHAR(40) UNIQUE NOT NULL,
  job_id           UUID NOT NULL REFERENCES repair_jobs(id) ON DELETE CASCADE,

  labour_amount    NUMERIC(12,2) DEFAULT 0,
  parts_amount     NUMERIC(12,2) DEFAULT 0,
  discount_amount  NUMERIC(12,2) DEFAULT 0,
  vat_percent      NUMERIC(5,2)  DEFAULT 5.00,   -- UAE VAT
  -- stored, not generated: keeps it portable across PG versions
  total_amount     NUMERIC(12,2) DEFAULT 0,

  status           VARCHAR(30) DEFAULT 'draft',
  valid_until      DATE,
  sent_at          TIMESTAMP,
  responded_at     TIMESTAMP,
  -- who approved, and how: whatsapp / call / email / signed
  approved_by      VARCHAR(150),
  approval_channel VARCHAR(40),
  notes            TEXT,

  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT quotations_status_chk
    CHECK (status IN ('draft','sent','approved','rejected','expired'))
);

CREATE INDEX IF NOT EXISTS idx_quotes_job    ON quotations(job_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotations(status);

-- ─────────────────────────────────────────────
-- QUOTATION_ITEMS — line items
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotation_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  description  TEXT NOT NULL,
  item_type    VARCHAR(20) DEFAULT 'part',   -- part | labour | service
  quantity     NUMERIC(10,2) DEFAULT 1,
  unit_price   NUMERIC(12,2) DEFAULT 0,
  line_total   NUMERIC(12,2) DEFAULT 0,
  sort_order   INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_qitems_quote ON quotation_items(quotation_id);

-- ─────────────────────────────────────────────
-- INVOICES — Blueprint Phase 5
-- Contract client: ONE invoice covers ALL jobs that month.
-- Walk-in: one invoice per job.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(40) UNIQUE NOT NULL,
  contract_id    UUID REFERENCES contracts(id) ON DELETE SET NULL,
  customer_id    UUID REFERENCES customers(id) ON DELETE SET NULL,

  period_month   INTEGER,   -- 1-12, for contract monthly invoices
  period_year    INTEGER,

  subtotal       NUMERIC(12,2) DEFAULT 0,
  vat_amount     NUMERIC(12,2) DEFAULT 0,
  total_amount   NUMERIC(12,2) DEFAULT 0,
  paid_amount    NUMERIC(12,2) DEFAULT 0,

  status         VARCHAR(30) DEFAULT 'draft',
  issue_date     DATE,
  due_date       DATE,
  sent_at        TIMESTAMP,
  notes          TEXT,

  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT invoices_status_chk
    CHECK (status IN ('draft','sent','partial','paid','overdue','cancelled')),
  CONSTRAINT invoices_month_chk
    CHECK (period_month IS NULL OR period_month BETWEEN 1 AND 12)
);

CREATE INDEX IF NOT EXISTS idx_inv_contract ON invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_inv_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_inv_status   ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_inv_period   ON invoices(period_year, period_month);

-- ─────────────────────────────────────────────
-- INVOICE_JOBS — which jobs on which invoice
-- This IS the indent sheet, in table form.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_jobs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id)    ON DELETE CASCADE,
  job_id     UUID NOT NULL REFERENCES repair_jobs(id) ON DELETE RESTRICT,
  amount     NUMERIC(12,2) DEFAULT 0,
  UNIQUE (invoice_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_invjobs_invoice ON invoice_jobs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invjobs_job     ON invoice_jobs(job_id);

-- ─────────────────────────────────────────────
-- PAYMENTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   UUID REFERENCES invoices(id) ON DELETE CASCADE,
  amount       NUMERIC(12,2) NOT NULL,
  method       VARCHAR(30) DEFAULT 'cash',  -- cash, bank, cheque, card, online
  reference    VARCHAR(150),                 -- cheque no / txn id
  received_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  received_by  VARCHAR(150),
  notes        TEXT
);

CREATE INDEX IF NOT EXISTS idx_pay_invoice ON payments(invoice_id);

-- ─────────────────────────────────────────────
-- JOB_ACTIVITY — audit trail
-- Every status change lands here. Answers "who changed what, when".
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_activity (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID NOT NULL REFERENCES repair_jobs(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(80) NOT NULL,
  from_status VARCHAR(30),
  to_status   VARCHAR(30),
  detail      TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_job ON job_activity(job_id);

-- ─────────────────────────────────────────────
-- updated_at auto-touch
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contracts_touch   ON contracts;
DROP TRIGGER IF EXISTS trg_customers_touch   ON customers;
DROP TRIGGER IF EXISTS trg_repair_jobs_touch ON repair_jobs;
DROP TRIGGER IF EXISTS trg_quotations_touch  ON quotations;
DROP TRIGGER IF EXISTS trg_invoices_touch    ON invoices;

CREATE TRIGGER trg_contracts_touch   BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_customers_touch   BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_repair_jobs_touch BEFORE UPDATE ON repair_jobs
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_quotations_touch  BEFORE UPDATE ON quotations
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_invoices_touch    BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─────────────────────────────────────────────
-- INDENT SHEET VIEW
-- Blueprint Phase 5 monthly summary, per contract.
-- Query this instead of maintaining an Excel tab by hand.
-- ─────────────────────────────────────────────
CREATE OR REPLACE VIEW v_indent_sheet AS
SELECT
  c.id                         AS contract_id,
  c.company_name,
  EXTRACT(YEAR  FROM rj.completed_at)::INT AS period_year,
  EXTRACT(MONTH FROM rj.completed_at)::INT AS period_month,
  COUNT(DISTINCT rj.id)        AS jobs_done,
  COALESCE(SUM(q.total_amount), 0) AS total_value
FROM contracts c
JOIN repair_jobs rj ON rj.contract_id = c.id
LEFT JOIN quotations q
       ON q.job_id = rj.id AND q.status = 'approved'
WHERE rj.status = 'completed'
  AND rj.completed_at IS NOT NULL
GROUP BY c.id, c.company_name,
         EXTRACT(YEAR FROM rj.completed_at),
         EXTRACT(MONTH FROM rj.completed_at);

-- ─────────────────────────────────────────────
-- LEAD SOURCE VIEW — proves which marketing works
-- Ties blueprint Phase 1/2 spend back to real money.
-- ─────────────────────────────────────────────
CREATE OR REPLACE VIEW v_lead_source_performance AS
SELECT
  cu.source,
  COUNT(DISTINCT cu.id) AS customers,
  COUNT(DISTINCT rj.id) AS jobs,
  COALESCE(SUM(q.total_amount), 0) AS revenue
FROM customers cu
LEFT JOIN repair_jobs rj ON rj.customer_id = cu.id
LEFT JOIN quotations  q  ON q.job_id = rj.id AND q.status = 'approved'
GROUP BY cu.source;
