-- Epic 12: Onboarding & Feature Discovery
-- Migration 1/4: Add onboarding discovery state columns to organizations
-- Story: 12-4 (checklist), 12-6 (user success), 12-1 (tour)
-- Safe: additive only, defaults prevent any null-check breakage

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS onboarding_checklist_state JSONB DEFAULT '{}' NOT NULL,
  ADD COLUMN IF NOT EXISTS onboarding_tour_shown BOOLEAN DEFAULT false NOT NULL;

COMMENT ON COLUMN organizations.onboarding_checklist_state IS
  'Tracks per-org checklist dismissal and email sequence state. Keys: dismissed (bool), email_sequence_sent (bool)';
COMMENT ON COLUMN organizations.onboarding_tour_shown IS
  'Set to true after the post-payment guided tour has been viewed or skipped once';
