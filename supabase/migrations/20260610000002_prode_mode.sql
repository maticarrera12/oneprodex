-- Add edit_locked column to predictions table
-- This column is the sole authority for whether a user may still edit scorers/cards for a given prediction row
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS edit_locked boolean NOT NULL DEFAULT false;

-- Add onboarding_mode column to users table
-- Allowed values: 'prode' (traditional mode) or 'quick' (existing 4-step wizard)
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_mode varchar(20) NOT NULL DEFAULT 'prode' CHECK (onboarding_mode IN ('prode', 'quick'));
