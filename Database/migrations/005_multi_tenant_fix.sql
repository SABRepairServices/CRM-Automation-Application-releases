-- ============================================================
-- 005_multi_tenant_fix.sql
-- Fixes a schema/service-layer mismatch: 003_multi_client.sql only
-- added client_id to repair_jobs, social_accounts, and posts.
-- The API service layer (customerService.js, quotationService.js,
-- invoiceService.js, technicianService.js) queries `WHERE client_id = $1`
-- against customers, quotations, invoices, technicians, and contracts
-- too — but those tables never got the column, so every one of those
-- endpoints would fail with "column client_id does not exist".
--
-- This migration adds the missing client_id columns and backfills
-- them where a relationship already exists to infer the right client.
-- ============================================================

-- customers: no direct link to a client today. Add the column so new
-- rows can be scoped; existing rows are backfilled via contracts, or
-- if there's exactly one client in the system (typical single-tenant
-- setup today), backfill to that client.
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_customers_client ON customers(client_id);

-- technicians: same situation.
ALTER TABLE technicians
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_technicians_client ON technicians(client_id);

-- contracts: same situation.
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client_id);

-- quotations: derivable via job_id -> repair_jobs.client_id. Denormalize
-- it onto quotations directly so the service layer can filter without a join.
ALTER TABLE quotations
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_quotations_client ON quotations(client_id);

UPDATE quotations q
SET client_id = rj.client_id
FROM repair_jobs rj
WHERE q.job_id = rj.id AND q.client_id IS NULL AND rj.client_id IS NOT NULL;

-- invoices: derivable via invoice_jobs -> repair_jobs.client_id, or via
-- contracts.client_id for contract invoices. Denormalize the same way.
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);

UPDATE invoices i
SET client_id = sub.client_id
FROM (
  SELECT ij.invoice_id, rj.client_id
  FROM invoice_jobs ij
  JOIN repair_jobs rj ON rj.id = ij.job_id
  WHERE rj.client_id IS NOT NULL
  GROUP BY ij.invoice_id, rj.client_id
) sub
WHERE i.id = sub.invoice_id AND i.client_id IS NULL;

UPDATE invoices i
SET client_id = c.client_id
FROM contracts c
WHERE i.contract_id = c.id AND i.client_id IS NULL AND c.client_id IS NOT NULL;

-- Trigger so future quotations/invoices auto-inherit client_id from their
-- job at insert time if the caller doesn't set it explicitly.
CREATE OR REPLACE FUNCTION set_quotation_client_id() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.client_id IS NULL THEN
    SELECT client_id INTO NEW.client_id FROM repair_jobs WHERE id = NEW.job_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quotations_client_id ON quotations;
CREATE TRIGGER trg_quotations_client_id
  BEFORE INSERT ON quotations
  FOR EACH ROW EXECUTE FUNCTION set_quotation_client_id();

-- ============================================================
-- quotation_number / invoice_number are NOT NULL UNIQUE with no
-- default anywhere — every insert from the service layer omits them,
-- so every createQuotation/createInvoice call would fail outright.
-- Add sequences + auto-generating defaults so the app doesn't have
-- to manage numbering itself.
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS quotation_number_seq;
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq;

ALTER TABLE quotations
  ALTER COLUMN quotation_number SET DEFAULT (
    'QT-' || to_char(now(), 'YYYYMM') || '-' || lpad(nextval('quotation_number_seq')::text, 4, '0')
  );

ALTER TABLE invoices
  ALTER COLUMN invoice_number SET DEFAULT (
    'INV-' || to_char(now(), 'YYYYMM') || '-' || lpad(nextval('invoice_number_seq')::text, 4, '0')
  );

-- ============================================================
-- repair_jobs has the same two problems: jobService.js filters on
-- rj.is_active (column doesn't exist) and never supplies job_number
-- (NOT NULL UNIQUE, no default) on insert.
-- ============================================================
ALTER TABLE repair_jobs
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

CREATE SEQUENCE IF NOT EXISTS job_number_seq;

ALTER TABLE repair_jobs
  ALTER COLUMN job_number SET DEFAULT (
    'SAB-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('job_number_seq')::text, 4, '0')
  );
