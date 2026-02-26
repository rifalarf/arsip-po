-- Seed: Create 2 Supabase Auth users + link to users table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
--
-- This script:
-- 1. Creates auth.users entries (email+password login)
-- 2. Inserts or updates rows in the public.users table with auth_id, username, email
--
-- ⚠️ Run the migration (20260226_add_auth_columns_to_users.sql) FIRST.
-- ⚠️ After running this seed, go back to the migration file and uncomment
--    the ALTER COLUMN ... SET NOT NULL lines, then run them.

-- ============================================================
-- 1. Create Auth Users
-- ============================================================
-- Password hashes below are for bcrypt. Supabase uses bcrypt by default.
-- We use the raw_user_meta_data to store display name.

-- Admin user: admin@arsip.local / Admin123!
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@arsip.local',
  crypt('Admin123!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Administrator"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (email) DO NOTHING;

-- Buyer user: buyer@arsip.local / Buyer123!
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'buyer@arsip.local',
  crypt('Buyer123!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Buyer"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (email) DO NOTHING;

-- Also insert identities for each user (required for email/password sign-in)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  u.id,
  u.id,
  json_build_object('sub', u.id::text, 'email', u.email),
  'email',
  u.id::text,
  NOW(),
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email IN ('admin@arsip.local', 'buyer@arsip.local')
ON CONFLICT (provider, provider_id) DO NOTHING;

-- ============================================================
-- 2. Link to public.users table
-- ============================================================

-- Option A: If users table already has rows for admin/buyer roles, UPDATE them:
-- (Adjust the WHERE clause or use INSERT if you prefer fresh rows)

-- Admin profile
INSERT INTO users (id, auth_id, username, email, name, role, is_active)
SELECT
  gen_random_uuid()::text,
  u.id,
  'admin',
  'admin@arsip.local',
  'Administrator',
  'admin',
  true
FROM auth.users u
WHERE u.email = 'admin@arsip.local'
ON CONFLICT (auth_id) DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- Buyer profile
INSERT INTO users (id, auth_id, username, email, name, role, is_active)
SELECT
  gen_random_uuid()::text,
  u.id,
  'buyer',
  'buyer@arsip.local',
  'Buyer',
  'buyer',
  true
FROM auth.users u
WHERE u.email = 'buyer@arsip.local'
ON CONFLICT (auth_id) DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- ============================================================
-- 3. Verify
-- ============================================================
SELECT u.id, u.auth_id, u.username, u.email, u.name, u.role, u.is_active
FROM users u
WHERE u.username IN ('admin', 'buyer');
