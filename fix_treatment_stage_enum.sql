-- =============================================================================
-- FIX: Add missing treatment_stage enum values
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- =============================================================================

-- Add 'social_reintegration' (used in UI dropdowns)
ALTER TYPE treatment_stage ADD VALUE IF NOT EXISTS 'social_reintegration';

-- Add 'follow_up' (UI uses 'follow_up', DB only had 'followup')
ALTER TYPE treatment_stage ADD VALUE IF NOT EXISTS 'follow_up';

-- Verify the final enum values
SELECT
  enumlabel AS value,
  enumsortorder AS sort_order
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'treatment_stage'
ORDER BY enumsortorder;