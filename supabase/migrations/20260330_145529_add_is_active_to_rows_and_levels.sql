-- Tambahkan kolom is_active ke tabel rows dan levels
-- Tabel racks dan bins sudah memiliki kolom is_active

ALTER TABLE rows ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE levels ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
