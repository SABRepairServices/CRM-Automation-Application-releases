-- ============================================================
-- 008_whatsapp_bot.sql
-- Foundation for the WhatsApp technician bot (Phase 1).
-- Adds: billing_type on customers (individual vs contractor, for
-- the invoice-hold logic), and two tables to track bot state —
-- one job-scoped conversation thread per approval cycle, and a
-- raw inbound/outbound message log for debugging.
-- ============================================================

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS billing_type VARCHAR(20) DEFAULT 'individual';

ALTER TABLE customers
  ADD CONSTRAINT customers_billing_type_chk
  CHECK (billing_type IN ('individual', 'contractor'));

-- One row per job while it's moving through the WhatsApp approval
-- flow (inspection sent -> awaiting reply -> quotation sent -> ...).
-- Lets the bot know what an incoming "approved"/"rejected" reply
-- is actually replying to.
CREATE TABLE IF NOT EXISTS whatsapp_job_threads (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  job_id            UUID NOT NULL REFERENCES repair_jobs(id) ON DELETE CASCADE,
  technician_id     UUID REFERENCES technicians(id) ON DELETE SET NULL,

  -- what the bot is currently waiting on a reply about
  stage             VARCHAR(30) NOT NULL,
  -- which document this stage's outbound message referred to
  document_type     VARCHAR(20),
  document_id       UUID,

  customer_whatsapp VARCHAR(30),
  technician_whatsapp VARCHAR(30),

  status            VARCHAR(20) NOT NULL DEFAULT 'awaiting_customer',

  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT whatsapp_job_threads_stage_chk
    CHECK (stage IN ('inspection_sent', 'quotation_sent', 'invoice_sent', 'awaiting_completion')),
  CONSTRAINT whatsapp_job_threads_status_chk
    CHECK (status IN ('awaiting_customer', 'awaiting_technician', 'approved', 'rejected', 'closed'))
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_threads_job ON whatsapp_job_threads(job_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_threads_client ON whatsapp_job_threads(client_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_threads_status ON whatsapp_job_threads(status);

-- Raw message log — every inbound/outbound WhatsApp message the bot
-- handles, kept for debugging the parsing/flow logic.
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID REFERENCES clients(id) ON DELETE CASCADE,
  thread_id     UUID REFERENCES whatsapp_job_threads(id) ON DELETE SET NULL,
  direction     VARCHAR(10) NOT NULL,
  from_number   VARCHAR(30),
  to_number     VARCHAR(30),
  body          TEXT,
  raw_payload   JSONB,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT whatsapp_messages_direction_chk
    CHECK (direction IN ('inbound', 'outbound'))
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_thread ON whatsapp_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_client ON whatsapp_messages(client_id);
