# Fix: redirect_uri_mismatch Error

## The Problem

You're getting this error:
```
Error 400: redirect_uri_mismatch
redirect_uri=https://infin8content.com/api/dashboard/google/oauth/callback
```

This means Google doesn't recognize `https://infin8content.com/api/dashboard/google/oauth/callback` as an authorized redirect URI.

---

## The Fix: Add Redirect URI to Google Cloud Console

### Step 1: Open Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Make sure you're in your `Infin8Content` project
3. Click on your project name if you see multiple projects

### Step 2: Go to OAuth Credentials

1. Click **APIs & Services** (left sidebar)
2. Click **Credentials**
3. Look for your OAuth 2.0 Client (should say "Web application")
4. Click on it to open the details

### Step 3: Add the Production Redirect URI

Under **Authorized redirect URIs**, you should see:
```
http://localhost:3000/api/dashboard/google/oauth/callback
```

**Click "Add URI"** and add:
```
https://infin8content.com/api/dashboard/google/oauth/callback
```

Your list should now have BOTH:
```
http://localhost:3000/api/dashboard/google/oauth/callback
https://infin8content.com/api/dashboard/google/oauth/callback
```

### Step 4: Save

Click **SAVE** at the bottom of the page

---

## Step-by-Step with Screenshots

If you're unsure, here's the exact path:

1. **Google Cloud Console home page**
   ```
   Google Cloud Console
   └─ Select your project (Infin8Content)
   ```

2. **Navigate to credentials**
   ```
   Left sidebar:
   └─ APIs & Services
      └─ Credentials
   ```

3. **Find your OAuth app**
   ```
   In the credentials list, find:
   "OAuth 2.0 Client IDs"
   └─ Click the one labeled "Web application"
   ```

4. **Edit the app**
   ```
   OAuth client details page will open
   Scroll down to: "Authorized redirect URIs"
   ```

5. **Add the production URI**
   ```
   Current:
   http://localhost:3000/api/dashboard/google/oauth/callback
   
   Add new:
   https://infin8content.com/api/dashboard/google/oauth/callback
   
   Then click: SAVE
   ```

---

## Important Details

✅ **Must be HTTPS** (not HTTP)
✅ **No trailing slash**
✅ **Exact match** (case-sensitive)
✅ **Include the full path** `/api/dashboard/google/oauth/callback`

### ❌ WRONG:
```
https://infin8content.com/                    (missing path)
https://infin8content.com/oauth/callback      (wrong path)
http://infin8content.com/api/...              (HTTP not HTTPS)
https://infin8content.com/api/dashboard/google/oauth/callback/  (trailing slash)
```

### ✅ CORRECT:
```
https://infin8content.com/api/dashboard/google/oauth/callback
```

---

## After You Save

1. **Wait 1-2 minutes** for Google to apply the change
2. **Clear your browser cache** (Ctrl+Shift+Delete or Cmd+Shift+Delete)
3. **Try connecting again**:
   - Go to `/dashboard/track`
   - Click Settings
   - Click "Connect with Google"
   - Should work now!

---

## Still Not Working?

If you still get the error:

1. **Double-check the URI** in Google Cloud Console
   - Copy/paste it here to verify:
   ```
   https://infin8content.com/api/dashboard/google/oauth/callback
   ```

2. **Clear everything**:
   - Close browser completely
   - Open incognito/private window
   - Try again

3. **Check your domain**:
   - Make sure `https://infin8content.com` is actually live
   - Test: Visit `https://infin8content.com/dashboard/track`
   - Should load without errors

4. **Verify .env.local**:
   - Check `NEXT_PUBLIC_APP_URL=https://infin8content.com`
   - Check `GOOGLE_CLIENT_ID=...`
   - Check `GOOGLE_CLIENT_SECRET=...`
   - All three should be set correctly

---

## Summary

**The fix is simple:**
1. Go to Google Cloud Console
2. Open your OAuth credentials
3. Add `https://infin8content.com/api/dashboard/google/oauth/callback` to Authorized redirect URIs
4. Click SAVE
5. Wait 1-2 minutes
6. Try again

That's it! 🚀
