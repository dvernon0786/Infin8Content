-- ============================================================
-- Migration: Rename has_cta to add_cta
-- Date: 2026-03-02
-- Description: Standardizes the CTA field name to match the code.
-- ============================================================

-- 1. Rename has_cta to add_cta in content_defaults JSONB column
UPDATE organizations
SET content_defaults = (content_defaults - 'has_cta') || jsonb_build_object('add_cta', (content_defaults->>'has_cta')::boolean)
WHERE content_defaults ? 'has_cta';

-- 2. Verify: Ensure any new default values also use add_cta
-- (Triggers or constraints could go here, but for now we focus on the data)
