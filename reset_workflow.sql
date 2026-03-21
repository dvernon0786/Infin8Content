UPDATE intent_workflows
SET
  current_step = 1,
  status = 'step_1_icp',
  icp_data = NULL,
  step_1_icp_completed_at = NULL,
  step_1_icp_error_message = NULL,
  step_1_icp_last_error_message = NULL,
  retry_count = 0,
  workflow_data = '{}'::jsonb
WHERE id = '63fc648d-1518-405a-8e17-05973c608c71';
