-- Migration: Create ai_usage_ledger table for zero-legacy cost enforcement
-- Date: 2026-02-15
-- Purpose: Replace workflow_data cost storage with proper ledger system

CREATE TABLE ai_usage_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  model text NOT NULL,
  prompt_tokens int NOT NULL,
  completion_tokens int NOT NULL,
  cost numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_ai_usage_ledger_workflow ON ai_usage_ledger(workflow_id);
CREATE INDEX idx_ai_usage_ledger_org_month ON ai_usage_ledger(organization_id, created_at);

-- Row Level Security
ALTER TABLE ai_usage_ledger ENABLE ROW LEVEL SECURITY;

-- Policy: Organizations can only see their own usage
CREATE POLICY "Organizations can view own AI usage" ON ai_usage_ledger
  FOR SELECT USING (organization_id = auth.uid());

-- Policy: Service role can insert usage records
CREATE POLICY "Service role can insert AI usage" ON ai_usage_ledger
  FOR INSERT WITH CHECK (true);

-- Comment on table
COMMENT ON TABLE ai_usage_ledger IS 'Financial audit trail for AI usage costs across workflows';
