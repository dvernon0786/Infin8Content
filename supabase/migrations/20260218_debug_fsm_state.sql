-- Debug the exact workflow state and enum values
SELECT 
  state::text as state_text,
  state,
  pg_typeof(state),
  length(state::text) as state_length,
  ascii(state::text) as state_ascii
FROM intent_workflows
WHERE id = '8f03434c-f3e0-4f57-aa42-b9caf17b430e';

-- Show all enum values
SELECT unnest(enum_range(NULL::workflow_state_enum)) as enum_values;

-- Check for any hidden characters or whitespace issues
SELECT 
  enumval,
  length(enumval::text) as length,
  ascii(enumval::text) as ascii
FROM unnest(enum_range(NULL::workflow_state_enum)) as enumval
WHERE enumval::text LIKE '%longtails%';
