-- Epic 12: Onboarding & Feature Discovery
-- Migration 3/4: User feedback collection
-- Story: 12-9 (user feedback collection)

CREATE TABLE IF NOT EXISTS user_feedback (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('nps', 'feature_request', 'bug_report', 'general')),
  nps_score     INT CHECK (nps_score BETWEEN 0 AND 10),
  body          TEXT,
  trigger_event TEXT,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_feedback_org ON user_feedback (org_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_type ON user_feedback (feedback_type);

-- RLS: users can only insert; reading is service_role only (admin visibility)
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can submit feedback"
  ON user_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM users WHERE auth_user_id = auth.uid()
    )
  );
