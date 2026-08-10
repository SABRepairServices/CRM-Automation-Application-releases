-- Switches login from password to a numeric PIN (reuses password_hash — a
-- PIN is just hashed the same way) and adds columns for the email-OTP
-- "forgot PIN" recovery flow.
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP;
