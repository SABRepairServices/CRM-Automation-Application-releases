-- ============================================================
-- 015_document_logo.sql
-- Separates the small app-badge logo (sidebar/header, clients.logo_url)
-- from the logo printed on Quotations/Invoices/Inspection Reports.
-- Businesses often want a compact square mark for the app UI but a wider
-- letterhead-style logo on official documents — one shared field forced
-- the same image into both places.
-- ============================================================

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS document_logo_url VARCHAR(500);
