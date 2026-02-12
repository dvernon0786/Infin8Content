-- Add decision tracking columns to keywords table
-- This enables traceable decision systems for enterprise-grade SEO intelligence platform

-- Add decision tracking columns
ALTER TABLE keywords 
ADD COLUMN IF NOT EXISTS user_selected BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS ai_suggested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS selection_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS selection_source TEXT DEFAULT 'ai', -- 'user' | 'ai' | 'bulk_action'
ADD COLUMN IF NOT EXISTS exclusion_reason TEXT,
ADD COLUMN IF NOT EXISTS decision_confidence FLOAT DEFAULT 0.0;

-- Add indexes for performance on decision queries
CREATE INDEX IF NOT EXISTS idx_keywords_user_selected ON keywords(user_selected);
CREATE INDEX IF NOT EXISTS idx_keywords_selection_source ON keywords(selection_source);
CREATE INDEX IF NOT EXISTS idx_keywords_decision_confidence ON keywords(decision_confidence);

-- Add RLS policy for decision tracking
-- Users can only modify their own organization's keyword decisions
CREATE POLICY "Users can update keyword decisions for their organization" ON keywords
FOR UPDATE USING (
  organization_id = (
    SELECT org_id 
    FROM users 
    WHERE auth_user_id = auth.uid()
    LIMIT 1
  )
);

-- Add comment explaining the decision tracking system
COMMENT ON COLUMN keywords.user_selected IS 'User-controlled selection flag for clustering input. TRUE = include in clustering, FALSE = exclude.';
COMMENT ON COLUMN keywords.ai_suggested IS 'AI recommendation flag. TRUE = AI suggested this keyword for selection.';
COMMENT ON COLUMN keywords.selection_timestamp IS 'When the selection decision was made.';
COMMENT ON COLUMN keywords.selection_source IS 'Source of selection decision: user, ai, or bulk_action.';
COMMENT ON COLUMN keywords.exclusion_reason IS 'Why keyword was excluded (if user_selected = false).';
COMMENT ON COLUMN keywords.decision_confidence IS 'AI confidence score (0.0-1.0) for keyword selection recommendation.';
