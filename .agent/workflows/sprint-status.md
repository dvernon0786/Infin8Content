---
description: Check current sprint status and progress
---

# Sprint Status Workflow

This workflow helps you check the current sprint status and identify what to work on next.

## Steps

1. **View sprint status overview**
   // turbo
   ```bash
   cat /home/dghost/Infin8Content-1/_bmad-output/sprint-status.yaml | head -60
   ```

2. **Check Epic 1 progress**
   // turbo
   ```bash
   cat /home/dghost/Infin8Content-1/_bmad-output/sprint-status.yaml | grep -A 15 "epic-1:"
   ```

3. **Find stories in progress**
   // turbo
   ```bash
   grep "in-progress" /home/dghost/Infin8Content-1/_bmad-output/sprint-status.yaml
   ```

4. **Find stories ready for dev**
   // turbo
   ```bash
   grep "ready-for-dev" /home/dghost/Infin8Content-1/_bmad-output/sprint-status.yaml
   ```

5. **Find stories in review**
   // turbo
   ```bash
   grep "review" /home/dghost/Infin8Content-1/_bmad-output/sprint-status.yaml
   ```

6. **Check MVP priorities (P0 stories)**
   ```bash
   grep -A 1 "P0" /home/dghost/Infin8Content-1/_bmad-output/sprint-status.yaml | head -30
   ```

## Success Criteria

- ✅ Current sprint status understood
- ✅ Active stories identified
- ✅ Next story to work on identified
