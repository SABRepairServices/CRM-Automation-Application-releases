-- ============================================================
-- 014_whatsapp_connection.sql
-- Lets each client connect their own real WhatsApp Business number
-- from Settings, instead of the whole app sharing one number set only
-- via a Render environment variable. Token is stored encrypted
-- (AES-256-GCM, see API/app/services/cryptoService.js) — never in
-- plaintext.
-- ============================================================

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS whatsapp_token_encrypted VARCHAR(500),
  ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id VARCHAR(60),
  ADD COLUMN IF NOT EXISTS whatsapp_display_number  VARCHAR(30),
  ADD COLUMN IF NOT EXISTS whatsapp_connected_at    TIMESTAMP;
