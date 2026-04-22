---
description: Deploy application
---

# Deploy

## Pre-deploy

- Ensure CI is green and all tests pass.
- Review changelog and confirm version bump if required.

## Deploy Steps

### Git Workflow: Direct Production Deployment

**Key Rule:** Any push to `test-main-all` = Production deployment on Vercel. Any other branch = Preview deployment. No PRs needed for production — merge locally and push directly.

```bash
# 1. Start from clean test-main-all
git checkout test-main-all
git pull origin test-main-all

# 2. Create topic branch
git checkout -b fix/your-feature-name

# 3. Make changes, then commit
git add .
git commit -m "fix: description of change"

# 4. Push topic branch
git push -u origin fix/your-feature-name

# 5. Merge directly to test-main-all (triggers Production on Vercel)
git checkout test-main-all
git merge fix/your-feature-name
git push origin test-main-all
```

### Additional Steps (Optional)

1. Tag the release, e.g.:

```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin --tags
```

2. Run smoke tests and monitor application metrics.

## Rollback

- Follow the rollback playbook in the runbook if issues are detected.
---
description: Deploy the Infin8Content application
---

# Deploy Workflow

This workflow guides you through deploying the Infin8Content application.

## Prerequisites

- All tests pass
- Code is merged to main branch
- Environment variables are configured
- Database migrations are ready

## Steps

1. **Run pre-deployment checks**
   // turbo
   ```bash
   cd /home/dghost/Infin8Content/infin8content && npm test
   ```

2. **Run linter**
   // turbo
   ```bash
   cd /home/dghost/Infin8Content/infin8content && npm run lint
   ```

3. **Build production bundle**
   ```bash
   cd /home/dghost/Infin8Content/infin8content && npm run build
   ```

4. **Run database migrations** (if needed)
   ```bash
   # Supabase migrations
   npx supabase db push
   ```

5. **Deploy to hosting platform**
   ```bash
   # Example for Vercel
   npx vercel --prod
   
   # Or for other platforms, follow their deployment process
   ```

6. **Verify deployment**
   - Check application is accessible
   - Test critical user flows
   - Verify database connections
   - Check API integrations

7. **Monitor for errors**
   - Check error logs
   - Monitor performance metrics
   - Watch for user reports

## Success Criteria

- ✅ Production build succeeds
- ✅ Database migrations applied
- ✅ Application deployed successfully
- ✅ Critical flows verified
- ✅ No errors in logs
