-- Google OAuth için migration
-- Bu SQL'i MySQL'de bir kez çalıştır:
--   mysql -u oda_app -p oda_arkadasim < server/migrate-google.sql

ALTER TABLE users
  MODIFY COLUMN password_hash VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) NULL UNIQUE AFTER email;
