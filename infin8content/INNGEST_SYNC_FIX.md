# Inngest Sync URL Configuration Fix

## Issue
Inngest is attempting to sync to the root path (`/`) instead of `/api/inngest`, causing 405 Method Not Allowed errors.

**Error in logs:**
```
requestPath: "infin8content.com/"
requestMethod: "PUT"
responseStatusCode: 405
message: "INVALID_REQUEST_METHOD: This Request was not made with an accepted method"
requestUserAgent: "inngest.com"
```

## Root Cause
The Inngest dashboard sync URL is configured incorrectly, pointing to the root domain instead of the Inngest sync endpoint.

## Solution

### Step 1: Update Inngest Dashboard Configuration

1. Go to **Inngest Dashboard** → **Settings** → **Sync Settings**
2. Find the **App URL** field
3. Update from:
   ```
   https://infin8content.com/
   ```
   To:
   ```
   https://infin8content.com/api/inngest
   ```
4. Ensure **Signing Key** matches your `INNGEST_SIGNING_KEY` environment variable
5. If you have Deployment Protection enabled, ensure **Deployment Protection Key** is set
6. Click **Save** or **Sync App**

### Step 2: Verify Configuration

After updating, Inngest will attempt to sync. You should see:
- ✅ Successful sync status
- ✅ Function `article/generate` listed in Functions
- ✅ No more 405 errors in Vercel logs

### Step 3: Test Endpoint Manually

Verify the endpoint is accessible:

```bash
curl https://infin8content.com/api/inngest
```

Expected response: JSON with function definitions (or error message if env vars missing)

## Current Configuration Status

✅ **Endpoint exists:** `/app/api/inngest/route.ts`  
✅ **Handlers configured:** GET, POST, PUT all exported  
✅ **Middleware configured:** `/api/inngest` bypasses authentication  
✅ **Environment variables:** Should be set in Vercel (INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY)  

❌ **Inngest Dashboard:** Sync URL pointing to wrong path (`/` instead of `/api/inngest`)

## Verification Checklist

- [ ] Inngest Dashboard sync URL updated to `https://infin8content.com/api/inngest`
- [ ] Signing key matches Vercel environment variable
- [ ] Deployment protection key configured (if enabled)
- [ ] Sync attempted and successful
- [ ] Functions visible in Inngest dashboard
- [ ] No 405 errors in Vercel logs

## Additional Notes

- The `/api/inngest` endpoint correctly handles GET (health check), POST (events), and PUT (sync) requests
- The endpoint will return 500 if `INNGEST_EVENT_KEY` is not set (this is expected behavior)
- Ensure environment variables are set in Vercel **Production** environment and app is redeployed

