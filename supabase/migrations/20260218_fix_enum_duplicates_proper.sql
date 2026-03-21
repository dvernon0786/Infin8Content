-- Proper enum cleanup - recreate enum with canonical lowercase format
-- This migration completely replaces the enum to use lowercase terminal states

-- Create final enum with canonical lowercase format
CREATE TYPE workflow_state_enum_final AS ENUM (
  'CREATED',  -- Initial state
  'step_1_icp',
  'step_2_competitors',
  'step_3_seeds',
  'step_4_longtails',
  'step_5_filtering',
  'step_6_clustering',
  'step_7_validation',
  'step_8_subtopics',
  'step_9_articles',
  'cancelled',  -- Canonical lowercase
  'completed', -- Canonical lowercase
  'step_4_longtails_running',
  'step_4_longtails_failed',
  'step_5_filtering_running',
  'step_5_filtering_failed',
  'step_6_clustering_running',
  'step_6_clustering_failed',
  'step_7_validation_running',
  'step_7_validation_failed',
  'step_8_subtopics_running',
  'step_8_subtopics_failed',
  'step_9_articles_running',
  'step_9_articles_failed',
  'step_9_articles_queued'
);

-- Update the table to use the new enum
-- First drop the default, then alter the type, then restore the default
ALTER TABLE intent_workflows ALTER COLUMN state DROP DEFAULT;

-- Migrate directly to final enum with lowercase conversion
ALTER TABLE intent_workflows 
ALTER COLUMN state TYPE workflow_state_enum_final 
USING 
  CASE 
    WHEN state = 'COMPLETED' THEN 'completed'::workflow_state_enum_final
    WHEN state = 'CANCELLED' THEN 'cancelled'::workflow_state_enum_final
    ELSE state::text::workflow_state_enum_final
  END;

-- Restore the default (using CREATED as the original default)
ALTER TABLE intent_workflows ALTER COLUMN state SET DEFAULT 'CREATED';

-- Clean up old enum
DROP TYPE workflow_state_enum;

-- Rename the final enum to the original name
ALTER TYPE workflow_state_enum_final RENAME TO workflow_state_enum;

-- Verification - show final enum values
SELECT unnest as enum_value
FROM unnest(enum_range(NULL::workflow_state_enum)) as unnest
ORDER BY unnest;
