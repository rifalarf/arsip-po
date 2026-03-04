-- ==========================================
-- Migration: Add file_url column to pos table
-- For storing Cloudflare R2 document scan URLs
-- ==========================================

ALTER TABLE pos ADD COLUMN IF NOT EXISTS file_url TEXT DEFAULT NULL;

COMMENT ON COLUMN pos.file_url IS 'URL to scanned document file stored in Cloudflare R2';
