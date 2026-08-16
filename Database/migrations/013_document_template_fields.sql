-- ============================================================
-- 013_document_template_fields.sql
-- Adds the fields needed for the redesigned Quotation / Inspection /
-- Invoice / Monthly Invoice document system (navy/gold branded office
-- template). Reuses existing repair_jobs fields (appliance_type, brand,
-- model, serial_number, technician_id, priority) rather than duplicating
-- them — only genuinely new fields are added here.
-- ============================================================

-- ─────────────────────────────────────────────
-- CUSTOMERS — office-facing contact details that appear on every
-- document for this customer, not re-typed per document.
-- ─────────────────────────────────────────────
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS contact_person       VARCHAR(150),
  ADD COLUMN IF NOT EXISTS building_number      VARCHAR(80),
  ADD COLUMN IF NOT EXISTS location_landmark    VARCHAR(200),
  ADD COLUMN IF NOT EXISTS panel_account_number VARCHAR(80);

-- ─────────────────────────────────────────────
-- QUOTATIONS — repair type + signatures
-- ─────────────────────────────────────────────
ALTER TABLE quotations
  ADD COLUMN IF NOT EXISTS repair_type VARCHAR(40),
  ADD COLUMN IF NOT EXISTS signatures  JSONB DEFAULT '{}'::jsonb;

ALTER TABLE quotations
  DROP CONSTRAINT IF EXISTS quotations_repair_type_chk;
ALTER TABLE quotations
  ADD CONSTRAINT quotations_repair_type_chk CHECK (
    repair_type IS NULL OR repair_type IN (
      'on_site','workshop','inspection_only','part_replacement','service'
    )
  );

-- ─────────────────────────────────────────────
-- INSPECTION_REPORTS — root cause, technician notes, diagnosis result,
-- signatures, and an extended status vocabulary matching the new
-- template's status bar (Pending / In Progress / Completed / Cannot
-- Repair) instead of the old draft/final pair.
-- ─────────────────────────────────────────────
ALTER TABLE inspection_reports
  ADD COLUMN IF NOT EXISTS root_cause       TEXT,
  ADD COLUMN IF NOT EXISTS technician_notes TEXT,
  ADD COLUMN IF NOT EXISTS diagnosis_result VARCHAR(20),
  ADD COLUMN IF NOT EXISTS signatures       JSONB DEFAULT '{}'::jsonb;

ALTER TABLE inspection_reports
  DROP CONSTRAINT IF EXISTS inspection_reports_diagnosis_result_chk;
ALTER TABLE inspection_reports
  ADD CONSTRAINT inspection_reports_diagnosis_result_chk CHECK (
    diagnosis_result IS NULL OR diagnosis_result IN ('onsite','workshop','cannot')
  );

-- Extend status: draft (not yet worked) -> in_progress -> completed
-- (finalize; auto-generates a quotation) or cannot_repair (finalize;
-- terminal, no quotation). 'final' is remapped to 'completed' so any
-- existing rows keep a valid status under the new constraint.
UPDATE inspection_reports SET status = 'completed' WHERE status = 'final';

ALTER TABLE inspection_reports
  DROP CONSTRAINT IF EXISTS inspection_reports_status_chk;
ALTER TABLE inspection_reports
  ADD CONSTRAINT inspection_reports_status_chk
    CHECK (status IN ('draft','in_progress','completed','cannot_repair'));

-- ─────────────────────────────────────────────
-- INVOICES — signatures only (payment method/date already lives on
-- the existing `payments` table; no new columns needed there).
-- ─────────────────────────────────────────────
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS signatures JSONB DEFAULT '{}'::jsonb;

-- ─────────────────────────────────────────────
-- MONTHLY_INVOICES — a single consolidated statement combining several
-- completed jobs for one contractor/company into one document. Mirrors
-- the invoices/invoice_jobs pattern: line items are real jobs, not
-- free-typed rows, so amounts always trace back to a real repair_jobs
-- record.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS monthly_invoices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number      VARCHAR(40) UNIQUE NOT NULL,
  client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  contract_id         UUID REFERENCES contracts(id) ON DELETE SET NULL,
  customer_id         UUID REFERENCES customers(id) ON DELETE SET NULL,

  month               INTEGER NOT NULL,
  year                INTEGER NOT NULL,

  payment_terms       VARCHAR(40) DEFAULT 'due_on_receipt',
  prepared_by         VARCHAR(150),
  to_email            VARCHAR(200),
  cc_email            VARCHAR(200),

  subtotal            NUMERIC(12,2) DEFAULT 0,
  total_received      NUMERIC(12,2) DEFAULT 0,
  total_pending       NUMERIC(12,2) DEFAULT 0,

  status              VARCHAR(30) DEFAULT 'draft',
  sent_at             TIMESTAMP,
  notes               TEXT,
  signatures          JSONB DEFAULT '{}'::jsonb,

  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT monthly_invoices_status_chk
    CHECK (status IN ('draft','sent','paid')),
  CONSTRAINT monthly_invoices_month_chk
    CHECK (month BETWEEN 1 AND 12),
  CONSTRAINT monthly_invoices_payment_terms_chk
    CHECK (payment_terms IN ('due_on_receipt','net_7','net_15','net_30','end_of_month'))
);

CREATE INDEX IF NOT EXISTS idx_minv_client   ON monthly_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_minv_contract ON monthly_invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_minv_customer ON monthly_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_minv_period   ON monthly_invoices(year, month);

CREATE SEQUENCE IF NOT EXISTS monthly_invoice_number_seq;
ALTER TABLE monthly_invoices
  ALTER COLUMN invoice_number SET DEFAULT (
    'MINV-' || to_char(now(), 'YYYYMM') || '-' || lpad(nextval('monthly_invoice_number_seq')::text, 4, '0')
  );

-- ─────────────────────────────────────────────
-- MONTHLY_INVOICE_JOBS — which completed jobs are on which monthly
-- statement, and how much was received against each one. A job can
-- only appear on one monthly invoice (prevents double-billing).
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS monthly_invoice_jobs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_invoice_id UUID NOT NULL REFERENCES monthly_invoices(id) ON DELETE CASCADE,
  job_id             UUID NOT NULL REFERENCES repair_jobs(id)      ON DELETE RESTRICT,
  amount             NUMERIC(12,2) DEFAULT 0,
  received_amount    NUMERIC(12,2) DEFAULT 0,
  UNIQUE (job_id)
);

CREATE INDEX IF NOT EXISTS idx_minvjobs_invoice ON monthly_invoice_jobs(monthly_invoice_id);
CREATE INDEX IF NOT EXISTS idx_minvjobs_job     ON monthly_invoice_jobs(job_id);

DROP TRIGGER IF EXISTS trg_monthly_invoices_touch ON monthly_invoices;
CREATE TRIGGER trg_monthly_invoices_touch BEFORE UPDATE ON monthly_invoices
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
