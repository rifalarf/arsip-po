-- Migration: Add department column to borrow_logs
-- Date: 2026-02-27
-- Run in Supabase SQL Editor: Dashboard > SQL Editor

ALTER TABLE borrow_logs
  ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT '';
