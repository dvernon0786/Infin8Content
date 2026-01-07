# Inngest Setup Guide

## Troubleshooting "We could not reach your URL" Error

If Inngest can't reach your endpoint, follow these steps:

### 1. Verify Your App is Deployed

- Ensure your app is deployed to Vercel and accessible at `https://infin8content.com`
- Check that the deployment is successful and not in a failed state
- Verify the domain is correctly configured

### 2. Test the Endpoint Manually

Test the endpoint directly in your browser or with curl:

```bash
# Test GET request (Inngest health check)
curl https://infin8content.com/api/inngest

# Should return a JSON response with your functions
```

If this fails, the endpoint isn't accessible.

### 3. Verify Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Required Variables:**
- `INNGEST_EVENT_KEY` - From Inngest Dashboard → Settings → API Keys → Event Key
- `INNGEST_SIGNING_KEY` - From Inngest Dashboard → Settings → API Keys → Signing Key

**Important:**
- Make sure these are set for **Production** environment
- After adding/updating env vars, **redeploy** your application

### 4. Check Vercel Deployment Protection

If you have Deployment Protection enabled:

1. Go to Vercel Dashboard → Settings → Deployment Protection
2. Enable "Protection Bypass for Automation"
3. Copy the generated secret token
4. In Inngest Dashboard → Sync Settings → Paste the token in "Deployment protection key" field

### 5. Check Server Logs

In Vercel Dashboard → Your Project → Deployments → Click on latest deployment → View Function Logs

Look for errors related to:
- Missing environment variables
- Import errors
- Runtime errors

### 6. Verify Middleware Configuration

The middleware should bypass authentication for `/api/inngest`. Check `app/middleware.ts`:

```typescript
// Inngest webhook endpoint - bypass authentication
const isInngestWebhook = request.nextUrl.pathname.startsWith('/api/inngest');

if (isPublicRoute || isInngestWebhook) {
  return response;
}
```

### 7. Common Issues

**Issue: Missing Environment Variables**
- Error: `INNGEST_EVENT_KEY is not defined`
- Solution: Add env vars in Vercel and redeploy

**Issue: Deployment Protection Blocking**
- Error: 403 Forbidden
- Solution: Configure deployment protection bypass (see step 4)

**Issue: Endpoint Returns 500**
- Check server logs for specific error
- Common causes: Missing env vars, import errors, database connection issues

**Issue: Endpoint Returns 404**
- Verify the route file exists at `app/api/inngest/route.ts`
- Ensure the file exports `GET`, `POST`, and `PUT` handlers

### 8. Manual Sync Steps

1. **Deploy your app** to Vercel
2. **Set environment variables** in Vercel (INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY)
3. **Redeploy** after setting env vars
4. **Test endpoint** manually: `curl https://infin8content.com/api/inngest`
5. **In Inngest Dashboard:**
   - Go to "Sync your app to Inngest"
   - Select "Sync manually"
   - Enter URL: `https://infin8content.com/api/inngest`
   - Paste Signing Key from Inngest Dashboard
   - Click "Sync app"

### 9. Verify Sync Success

After syncing, you should see:
- ✅ Green checkmark indicating successful sync
- Your function `article/generate` listed in the functions table
- Ability to trigger test events

## Local Development

For local development with Inngest Dev Server:

1. Install Inngest CLI: `npm install -g inngest-cli`
2. Run dev server: `npx inngest-cli@latest dev`
3. Set local env vars in `.env.local`:
   ```
   INNGEST_EVENT_KEY=your-event-key
   INNGEST_SIGNING_KEY=your-signing-key
   ```
4. Access Inngest UI at `http://localhost:8288`

## Production Checklist

- [ ] App deployed to Vercel
- [ ] Environment variables set in Vercel (Production)
- [ ] Deployment Protection bypass configured (if enabled)
- [ ] Endpoint accessible: `https://infin8content.com/api/inngest`
- [ ] Inngest dashboard shows successful sync
- [ ] Functions visible in Inngest dashboard

