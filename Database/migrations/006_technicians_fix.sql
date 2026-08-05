-- ============================================================
-- 006_technicians_fix.sql
-- technicianService.js referenced columns that never existed:
-- email, specializations, updated_at. The real table only has
-- name, phone, speciality (singular text), is_active, created_at.
-- Adding email + updated_at (genuinely useful, keeping them) and
-- aligning the app code to the existing singular `speciality` field
-- instead of inventing a specializations array.
-- ============================================================

ALTER TABLE technicians
  ADD COLUMN IF NOT EXISTS email VARCHAR(200),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
