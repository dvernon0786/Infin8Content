---
description: FSM workflow guide and canonical transitions
---

# FSM Workflow Guide — Infin8Content

**Generated:** 2026-04-10

Overview
- The system implements a deterministic Finite State Machine (FSM) with linear progression through 9 workflow states. The canonical FSM implementation lives in `infin8content/lib/fsm/`.

Canonical states

```text
step_1_icp           -- ICP generation
step_2_competitors   -- Competitor analysis
step_3_seeds         -- Seed keyword extraction
step_4_longtails     -- Long-tail expansion
step_5_filtering     -- Keyword filtering
step_6_clustering    -- Topic clustering
step_7_validation    -- Cluster validation
step_8_subtopics     -- Subtopic generation
step_9_articles      -- Article generation
completed            -- Final state
```

Canonical events (forward transitions)
- `ICP_COMPLETED`
- `COMPETITORS_COMPLETED`
- `SEEDS_APPROVED`
- `LONGTAILS_COMPLETED`
- `FILTERING_COMPLETED`
- `CLUSTERING_COMPLETED`
- `VALIDATION_COMPLETED`
- `SUBTOPICS_APPROVED`
- `ARTICLES_COMPLETED`

Atomic transition pattern (example)

1. Validate current state from DB.
2. Execute side-effect work (external APIs, generation) with retries.
3. Atomically update state in DB using `WHERE state = <expected>` to prevent races.
4. Append audit log entry for transition.

Diagram & derivation
- Generate a diagram from `lib/fsm/workflow-machine.ts` transition matrix. I can extract the transition matrix and render a diagram (Mermaid) on request.
