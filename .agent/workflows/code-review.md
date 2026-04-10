---
description: Submit code for review
---

# Code Review

## Pre-PR Checklist

- All tests pass locally.
- Lint and type checks completed.
- Clear PR description and linked issue.

## Submit PR

1. Push your branch and open a PR.
2. Assign reviewers and add context for the change.
3. Include a short testing guide and any migration notes.

## Addressing Feedback

- Respond to comments and make iterative fixes on the same branch.
- Re-run tests and request follow-up review when ready.

## Commands

```bash
git push
# Using GitHub CLI:
gh pr create --fill
```
---
description: Submit story for code review
---

# Code Review Workflow

This workflow guides you through submitting a completed story for code review.

## Prerequisites

- Story implementation is complete
- All tests pass
- Code follows project standards (TypeScript, ESLint)
- Story is currently in `in-progress` status

## Steps

1. **Run full test suite**
   // turbo
   ```bash
   cd infin8content && npm test
   ```

2. **Run linter**
   // turbo
   ```bash
   cd infin8content && npm run lint
   ```

3. **Check for security vulnerabilities**
   // turbo
   ```bash
   cd infin8content && npm audit
   ```

4. **Verify acceptance criteria**
   - Review story file: `_bmad-output/implementation-artifacts/[story-id].md`
   - Confirm all acceptance criteria are met
   - Test manually if needed

5. **Update story status to `review`**
   - Edit `_bmad-output/implementation-artifacts/sprint-status.yaml`
   - Change story status from `in-progress` → `review`

6. **Commit changes** (if using git)
   ```bash
   git add .
   git commit -m "[story-id]: [brief description]"
   git push origin feature/[story-id]
   ```

7. **Create pull request** (if using GitHub/GitLab)
   - Link to story file in PR description
   - List acceptance criteria as checklist
   - Add screenshots/demos if applicable

8. **Fresh context review** (recommended)
   - Use different LLM or fresh conversation
   - Review code for bugs, security issues, best practices
   - Check test coverage

## Success Criteria

- ✅ All tests pass
- ✅ No linting errors
- ✅ No security vulnerabilities
- ✅ Story status updated to `review`
- ✅ Code committed and pushed
- ✅ Pull request created (if applicable)
