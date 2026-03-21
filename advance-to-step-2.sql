-- Advance workflow to Step 2 state for concurrency testing
UPDATE intent_workflows
SET state = 'COMPETITOR_PENDING',
    updated_at = NOW()
WHERE id = '63fc648d-1518-405a-8e17-05973c608c71';

-- Verify the state change
SELECT id, state, status, current_step, updated_at
FROM intent_workflows 
WHERE id = '63fc648d-1518-405a-8e17-05973c608c71';
