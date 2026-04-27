# Google OAuth Setup for Infin8Content

## Current Configuration

✅ **GOOGLE_CLIENT_ID:** Already set in `.env.local`
✅ **GOOGLE_CLIENT_SECRET:** Already set in `.env.local`
✅ **NEXT_PUBLIC_APP_URL:** Updated to `https://infin8content.com`

## Production Redirect URI

**Your production redirect URI is:**
```
https://infin8content.com/api/dashboard/google/oauth/callback
```

## Google Cloud Console Setup

### Step 1: Go to Google Cloud Console

1. Navigate to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (should be `Infin8Content`)

### Step 2: Update OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Find your OAuth 2.0 Client (Web application)
3. Click on it to edit

### Step 3: Add Production Redirect URI

Under **Authorized redirect URIs**, you should see:
```
http://localhost:3000/api/dashboard/google/oauth/callback
```

**Add a new one:**
```
https://infin8content.com/api/dashboard/google/oauth/callback
```

Your list should now have:
```
http://localhost:3000/api/dashboard/google/oauth/callback
https://infin8content.com/api/dashboard/google/oauth/callback
```

### Step 4: Save

Click **"Save"** at the bottom

---

## How It Works Now

### Development (localhost)
```
User clicks "Connect Google"
        ↓
Redirect URI used: http://localhost:3000/api/dashboard/google/oauth/callback
        ↓
Works because NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production (infin8content.com)
```
User clicks "Connect Google"
        ↓
Redirect URI used: https://infin8content.com/api/dashboard/google/oauth/callback
        ↓
Works because NEXT_PUBLIC_APP_URL=https://infin8content.com
```

---

## Checklist

- [ ] Go to Google Cloud Console
- [ ] Open your OAuth credentials
- [ ] Add redirect URI: `https://infin8content.com/api/dashboard/google/oauth/callback`
- [ ] Click Save
- [ ] Test on production: https://infin8content.com/dashboard/track
- [ ] Click Settings → Connect Google Analytics
- [ ] Should redirect to Google login (NOT error)

---

## Troubleshooting

### Still seeing "redirect_uri_mismatch" error?

1. **Check Google Cloud Console:**
   - Make sure the redirect URI is **exactly**:
     ```
     https://infin8content.com/api/dashboard/google/oauth/callback
     ```
   - No trailing slash
   - HTTPS not HTTP
   - Exact case match

2. **Check `.env.local`:**
   - Make sure `NEXT_PUBLIC_APP_URL=https://infin8content.com`
   - No trailing slash
   - HTTPS not HTTP

3. **Restart your app:**
   ```bash
   npm run dev
   ```

4. **Clear browser cache:**
   - Open DevTools → Application → Clear cache
   - Or use incognito window

### Getting "invalid_client" error?

- Your `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` is wrong
- Copy/paste them again from Google Cloud Console
- Make sure there are no extra spaces

---

## Summary

The code now automatically uses the correct redirect URI based on your environment:

- **Dev:** Uses `http://localhost:3000`
- **Prod:** Uses `https://infin8content.com`

You just need to:
1. ✅ Update `.env.local` (DONE)
2. ⏳ Add the production redirect URI to Google Cloud Console (MANUAL)

That's it! 🚀
