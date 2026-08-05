-- ============================================================
-- 007_inspection_reports.sql
-- Inspection Reports as a real app module, mirroring the original
-- Excel "Oven Inspection Report" template: Sr No + Description per
-- defect, a Tax Summary block (Standard Rate 5%), Notes, and an
-- inspector/signature field. Linked to the same job_id chain as
-- Quotations and Invoices so all three live together per job.
-- ============================================================

CREATE TABLE IF NOT EXISTS inspection_reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_number     VARCHAR(40) UNIQUE NOT NULL,
  client_id         UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  job_id            UUID NOT NULL REFERENCES repair_jobs(id) ON DELETE CASCADE,

  inspected_by      VARCHAR(150),
  inspected_at      DATE DEFAULT CURRENT_DATE,

  taxable_amount    NUMERIC(12,2) DEFAULT 0,
  tax_rate          NUMERIC(5,2)  DEFAULT 5.00,
  tax_amount        NUMERIC(12,2) DEFAULT 0,

  notes             TEXT,
  status            VARCHAR(30) DEFAULT 'draft',

  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT inspection_reports_status_chk
    CHECK (status IN ('draft', 'final'))
);

CREATE INDEX IF NOT EXISTS idx_inspection_reports_client ON inspection_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_inspection_reports_job ON inspection_reports(job_id);

CREATE TABLE IF NOT EXISTS inspection_findings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_report_id UUID NOT NULL REFERENCES inspection_reports(id) ON DELETE CASCADE,
  description         TEXT NOT NULL,
  sort_order          INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_inspection_findings_report ON inspection_findings(inspection_report_id);

CREATE SEQUENCE IF NOT EXISTS inspection_report_number_seq;

ALTER TABLE inspection_reports
  ALTER COLUMN report_number SET DEFAULT (
    'INS-' || to_char(now(), 'YYYYMM') || '-' || lpad(nextval('inspection_report_number_seq')::text, 4, '0')
  );
