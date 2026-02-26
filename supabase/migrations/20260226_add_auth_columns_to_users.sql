-- Migration: Add auth columns to users table for Supabase Auth integration
-- Date: 2026-02-26

-- Add new columns
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Make username and email NOT NULL after backfill (run seed first, then uncomment below)
-- ALTER TABLE users ALTER COLUMN username SET NOT NULL;
-- ALTER TABLE users ALTER COLUMN email SET NOT NULL;
