-- Add missing AI metadata columns to keywords table
-- These columns are referenced in the code but missing from database schema

-- Add missing keyword metadata columns
ALTER TABLE keywords
ADD COLUMN IF NOT EXISTS detected_language TEXT,
ADD COLUMN IF NOT EXISTS is_foreign_language BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS main_intent TEXT,
ADD COLUMN IF NOT EXISTS is_navigational BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS foreign_intent JSONB,
ADD COLUMN IF NOT EXISTS ai_suggested BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS user_selected BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS decision_confidence DECIMAL(3,2) DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS selection_source TEXT DEFAULT 'ai',
ADD COLUMN IF NOT EXISTS selection_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add missing metadata column to audit table
ALTER TABLE workflow_transition_audit
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add comments for documentation
COMMENT ON COLUMN keywords.detected_language IS 'Language detected by DataForSEO for the keyword';
COMMENT ON COLUMN keywords.is_foreign_language IS 'Whether the keyword is in a foreign language';
COMMENT ON COLUMN keywords.main_intent IS 'Primary search intent (navigational, informational, commercial)';
COMMENT ON COLUMN keywords.is_navigational IS 'Whether the keyword has navigational intent';
COMMENT ON COLUMN keywords.foreign_intent IS 'Secondary search intents array';
COMMENT ON COLUMN keywords.ai_suggested IS 'Whether this keyword was suggested by AI';
COMMENT ON COLUMN keywords.user_selected IS 'Whether this keyword was selected by human user';
COMMENT ON COLUMN keywords.decision_confidence IS 'AI confidence score for keyword selection (0.0-1.0)';
COMMENT ON COLUMN keywords.selection_source IS 'Source of keyword selection (ai, user, etc.)';
COMMENT ON COLUMN keywords.selection_timestamp IS 'When the keyword was selected';
COMMENT ON COLUMN workflow_transition_audit.metadata IS 'Additional metadata for audit trail';
