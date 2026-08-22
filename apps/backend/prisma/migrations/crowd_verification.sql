-- Migration: Crowd Verification System
-- Run this BEFORE prisma db push

-- 1. Create crowd_workers table
CREATE TABLE IF NOT EXISTS crowd_workers (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  bmdc_reg_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Migrate existing DOCTOR users to crowd_workers
INSERT INTO crowd_workers (email, bmdc_reg_number, created_at)
SELECT email, institution, created_at
FROM users
WHERE role = 'DOCTOR'
ON CONFLICT (email) DO NOTHING;

-- 3. Add worker_id and claim columns to verifications
ALTER TABLE verifications ADD COLUMN IF NOT EXISTS worker_id INTEGER;
ALTER TABLE verifications ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
ALTER TABLE verifications ALTER COLUMN is_submitted SET DEFAULT false;
ALTER TABLE verifications ALTER COLUMN submitted_at DROP NOT NULL;

-- 4. Migrate existing verification data: doctor_id → worker_id
UPDATE verifications v
SET worker_id = cw.id
FROM crowd_workers cw
JOIN users u ON u.email = cw.email
WHERE v.doctor_id = u.id;

-- 5. Drop old tables and columns (safe after data migrated)
DROP TABLE IF EXISTS doctor_assignments CASCADE;
DROP TABLE IF EXISTS login_audit CASCADE;

-- 6. Drop old FK and column from verifications
ALTER TABLE verifications DROP CONSTRAINT IF EXISTS verifications_doctor_id_fkey;
ALTER TABLE verifications DROP COLUMN IF EXISTS doctor_id;

-- 7. Add FK for worker_id
ALTER TABLE verifications ADD CONSTRAINT verifications_worker_id_fkey
  FOREIGN KEY (worker_id) REFERENCES crowd_workers(id) ON DELETE CASCADE;

-- 8. Drop unused columns from users
ALTER TABLE users DROP COLUMN IF EXISTS specialty;
ALTER TABLE users DROP COLUMN IF EXISTS institution;
ALTER TABLE users DROP COLUMN IF EXISTS failed_login_count;
ALTER TABLE users DROP COLUMN IF EXISTS locked_at;
ALTER TABLE users DROP COLUMN IF EXISTS last_login_at;

-- 9. Change role column type from enum to text
ALTER TABLE users ALTER COLUMN role TYPE TEXT;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'ADMIN';

-- 10. Drop the old enum
DROP TYPE IF EXISTS "Role" CASCADE;

-- 11. Add unique constraint for worker verifications
ALTER TABLE verifications ADD CONSTRAINT verifications_record_id_worker_id_unique
  UNIQUE (record_id, worker_id);
