-- ============================================================
-- 012_client_vat_number.sql
-- Adds a Tax Registration Number field to the client (company) profile
-- so it can appear on printed Quotations/Invoices/Inspection Reports —
-- UAE FTA rules require a seller's TRN on tax invoices, and this was
-- entirely missing from the data model.
-- ============================================================

ALTER TABLE clients ADD COLUMN IF NOT EXISTS vat_number VARCHAR(50);
