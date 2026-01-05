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
   cd /home/dghost/Infin8Content-1/infin8content && npm test
   ```

2. **Run linter**
   // turbo
   ```bash
   cd /home/dghost/Infin8Content-1/infin8content && npm run lint
   ```

3. **Build production bundle**
   ```bash
   cd /home/dghost/Infin8Content-1/infin8content && npm run build
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
