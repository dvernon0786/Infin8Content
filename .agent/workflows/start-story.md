---
description: Start a new story
---

# Start Story

Short: Steps to begin work on a new story.

## Steps

1. Update the sprint board and claim the story.
2. Create a branch:

```bash
git checkout -b story/<ID>-short-description
```

3. Add tests and an initial implementation stub.
4. Run linters and type checks:

```bash
npm run lint
npm run build
```

5. Commit with a conventional message:

```bash
git add .
git commit -m "feat(story-<ID>): start implementation"
git push -u origin HEAD
```

6. Open a PR, link the story/issue, and add reviewers.

## Notes

- Use the PR template and include testing notes for reviewers.
- Keep changes small and focused; add tests for new behavior.
---
description: Start working on a new story from the sprint backlog
---

# Start Story Workflow

This workflow guides you through starting work on a new story from the sprint backlog.

## Prerequisites

- Sprint status file exists at `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Story is in `ready-for-dev` or `backlog` status
- Previous story is completed or you have capacity for parallel work

## Steps

1. **Review sprint status**
   ```bash
   cat _bmad-output/implementation-artifacts/sprint-status.yaml | grep -A 5 "development_status:"
   ```

2. **Identify next story**
   - Check the relevant epic for the next `ready-for-dev` or `backlog` story
   - Confirm story priority (P0 for MVP, P1 for post-MVP)

3. **Read story file**
   - Location: `_bmad-output/implementation-artifacts/[story-id].md`
   - Review acceptance criteria and technical requirements

4. **Update story status to `in-progress`**
   - Edit `_bmad-output/implementation-artifacts/sprint-status.yaml`
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
