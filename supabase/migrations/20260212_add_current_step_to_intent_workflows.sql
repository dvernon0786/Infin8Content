-- Migration: Add current_step column to intent_workflows for canonical state machine
-- Date: 2026-02-12
-- Purpose: Align database schema with canonical workflow logic

-- 1. Add column if it does not exist (idempotent)
alter table intent_workflows
add column if not exists current_step integer;

-- 2. Backfill current_step from existing status values
update intent_workflows
set current_step = case
  when status = 'step_1_icp' then 1
  when status = 'step_2_competitors' then 2
  when status = 'step_3_keywords' then 3
  when status = 'step_4_longtails' then 4
  when status = 'step_5_filtering' then 5
  when status = 'step_6_clustering' then 6
  when status = 'step_7_validation' then 7
  when status = 'step_8_subtopics' then 8
  when status = 'step_9_articles' then 9
  when status = 'completed' then 10
  when status = 'failed' then 1
  else 1
end
where current_step is null;

-- 3a. Set default for new workflows
alter table intent_workflows
alter column current_step set default 1;

-- 3b. Enforce NOT NULL
alter table intent_workflows
alter column current_step set not null;

-- 4. Add check constraint for valid step range (1-10 only)
alter table intent_workflows
add constraint intent_workflows_current_step_check
check (current_step >= 1 and current_step <= 10);

-- 5. Add composite index for common workflow queries
create index if not exists idx_intent_workflows_org_step
on intent_workflows (organization_id, current_step);

-- 6. Optional: Add trigger to enforce status-step synchronization
-- This ensures canonical invariants at database level
create or replace function enforce_status_step_sync()
returns trigger as $$
begin
  if (
    (new.current_step = 1 and new.status <> 'step_1_icp') or
    (new.current_step = 2 and new.status <> 'step_2_competitors') or
    (new.current_step = 3 and new.status <> 'step_3_keywords') or
    (new.current_step = 4 and new.status <> 'step_4_longtails') or
    (new.current_step = 5 and new.status <> 'step_5_filtering') or
    (new.current_step = 6 and new.status <> 'step_6_clustering') or
    (new.current_step = 7 and new.status <> 'step_7_validation') or
    (new.current_step = 8 and new.status <> 'step_8_subtopics') or
    (new.current_step = 9 and new.status <> 'step_9_articles') or
    (new.current_step = 10 and new.status <> 'completed')
  ) then
    raise exception 'Status and current_step are out of sync: status=%, current_step=%', new.status, new.current_step;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_enforce_status_step_sync on intent_workflows;

create trigger trg_enforce_status_step_sync
before update on intent_workflows
for each row
execute function enforce_status_step_sync();

-- Migration complete
-- Database now enforces canonical workflow state machine
