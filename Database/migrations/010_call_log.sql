-- ============================================================
-- 010_call_log.sql
-- Call Agent — interim scope. Real AI calling (outbound reminders,
-- inbound answering) is deferred (costs money, no free tier like
-- WhatsApp has — see FUTURE_WORK.md). For now: a plain call log so
-- calls to/from customers are tracked against their record, same as
-- every other customer interaction in this CRM.
-- ============================================================

CREATE TABLE IF NOT EXISTS calls (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  customer_id       UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  job_id            UUID REFERENCES repair_jobs(id) ON DELETE SET NULL,
  technician_id     UUID REFERENCES technicians(id) ON DELETE SET NULL,

  direction         VARCHAR(20) NOT NULL,
  purpose           VARCHAR(30) NOT NULL DEFAULT 'other',
  notes             TEXT,
  duration_minutes  NUMERIC(6,1),
  called_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT calls_direction_chk CHECK (direction IN ('inbound', 'outbound')),
  CONSTRAINT calls_purpose_chk CHECK (purpose IN ('reminder', 'follow_up', 'inquiry', 'complaint', 'quotation_discussion', 'other'))
);

CREATE INDEX IF NOT EXISTS idx_calls_client ON calls(client_id);
CREATE INDEX IF NOT EXISTS idx_calls_customer ON calls(customer_id);
CREATE INDEX IF NOT EXISTS idx_calls_job ON calls(job_id);
CREATE INDEX IF NOT EXISTS idx_calls_called_at ON calls(called_at);
