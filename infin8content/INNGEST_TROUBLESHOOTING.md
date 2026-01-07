# Inngest Sync Troubleshooting - Step by Step

## ✅ Step 1: Domain Configuration (COMPLETE)
Your domains are correctly configured:
- ✅ `infin8content.com` → Production
- ✅ `www.infin8content.com` → Production

## 🔍 Step 2: Check Environment Variables

Go to: **Vercel Dashboard → Settings → Environment Variables**

Verify these are set for **Production**:
- `INNGEST_EVENT_KEY` - Get from Inngest Dashboard → Settings → API Keys → Event Key
- `INNGEST_SIGNING_KEY` - Get from Inngest Dashboard → Settings → API Keys → Signing Key

**If missing:**
1. Add them in Vercel
2. Make sure they're set for **Production** environment
3. **Redeploy** your application (Deployments → Latest → Redeploy)

## 🔍 Step 3: Check Deployment Protection

Go to: **Vercel Dashboard → Settings → Deployment Protection**

**If Deployment Protection is enabled:**

1. Click "Protection Bypass for Automation"
2. Enable it and copy the generated secret token
3. In **Inngest Dashboard** → Sync Settings → Paste token in "Deployment protection key" field

## 🔍 Step 4: Test Endpoint Manually

Test if the endpoint is accessible:

```bash
# Test GET request (Inngest health check)
curl https://infin8content.com/api/inngest

# Expected response: JSON with your functions list
```

**If this fails:**
- Check Vercel deployment logs
- Verify the route file exists: `app/api/inngest/route.ts`
- Check for build errors

## 🔍 Step 5: Check Deployment Status

Go to: **Vercel Dashboard → Deployments**

Verify:
- ✅ Latest deployment is successful (green checkmark)
- ✅ Deployment is for Production branch
- ✅ No build errors

**If deployment failed:**
- Click on the failed deployment
- Check "Build Logs" for errors
- Common issues: Missing env vars, build errors, import errors

## 🔍 Step 6: Check Function Logs

Go to: **Vercel Dashboard → Deployments → Latest → Function Logs**

Look for:
- Errors about missing `INNGEST_EVENT_KEY` or `INNGEST_SIGNING_KEY`
- Runtime errors when accessing `/api/inngest`
- Import errors

## 🔍 Step 7: Verify Inngest Configuration

In **Inngest Dashboard** → Sync Settings:

1. **URL:** `https://infin8content.com/api/inngest`
2. **Signing Key:** Should match `INNGEST_SIGNING_KEY` from Vercel
3. **Deployment Protection Key:** (if using protection bypass)

## 🚀 Quick Fix Checklist

- [ ] Environment variables set in Vercel (Production)
- [ ] App redeployed after adding env vars
- [ ] Deployment Protection bypass configured (if enabled)
- [ ] Endpoint testable: `curl https://infin8content.com/api/inngest`
- [ ] Latest deployment successful
- [ ] No errors in function logs

## 📝 Most Likely Issue

**Missing Environment Variables** - This is the #1 cause of "could not reach URL" errors.

The endpoint fails silently if env vars aren't set, making it appear unreachable.

**Fix:**
1. Add `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` to Vercel
2. Redeploy
3. Retry sync in Inngest

