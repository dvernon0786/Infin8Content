-- Fix approval_type constraint to support both seed_keywords and subtopics
ALTER TABLE intent_approvals 
DROP CONSTRAINT intent_approvals_approval_type_check;

ALTER TABLE intent_approvals 
ADD CONSTRAINT intent_approvals_approval_type_check 
CHECK (approval_type IN ('seed_keywords', 'subtopics'));
