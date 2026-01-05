---
description: Start working on a new story from the sprint backlog
---

# Start Story Workflow

This workflow guides you through starting work on a new story from the sprint backlog.

## Prerequisites

- Sprint status file exists at `_bmad-output/sprint-status.yaml`
- Story is in `ready-for-dev` or `backlog` status
- Previous story is completed or you have capacity for parallel work

## Steps

1. **Review sprint status**
   ```bash
   cat _bmad-output/sprint-status.yaml | grep -A 5 "development_status:"
   ```

2. **Identify next story**
   - Check Epic 1 for next `ready-for-dev` or `backlog` story
   - Confirm story priority (P0 for MVP, P1 for post-MVP)

3. **Read story file**
   - Location: `_bmad-output/stories/[story-id].yaml`
   - Review acceptance criteria and technical requirements

4. **Update story status to `in-progress`**
   - Edit `_bmad-output/sprint-status.yaml`
   - Change story status from `ready-for-dev` → `in-progress`

5. **Create feature branch** (if using git)
   ```bash
   git checkout -b feature/[story-id]-[short-description]
   ```

6. **Review dependencies**
   - Check if story depends on other stories
   - Ensure database schema is up to date
   - Verify environment variables are configured

7. **Begin implementation**
   - Follow TDD approach
   - Write tests first
   - Implement feature
   - Run tests continuously

## Success Criteria

- ✅ Story status updated to `in-progress`
- ✅ Feature branch created
- ✅ Story requirements understood
- ✅ Development environment ready
