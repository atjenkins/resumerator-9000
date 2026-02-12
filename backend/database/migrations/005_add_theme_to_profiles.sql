-- Migration: Add theme preference to profiles
-- Date: 2026-02-12
-- Description: Adds theme_id column to store user's theme preference (default, robot, designer, fairies)

-- Add theme_id column
ALTER TABLE profiles ADD COLUMN theme_id TEXT NOT NULL DEFAULT 'default';

-- Index for faster theme queries (optional, but good practice)
CREATE INDEX idx_profiles_theme_id ON profiles(theme_id);

-- Rollback instructions:
-- DROP INDEX IF EXISTS idx_profiles_theme_id;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS theme_id;
