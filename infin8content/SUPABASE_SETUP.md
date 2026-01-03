# How to Get Supabase Environment Variables from Dashboard

## Prerequisites
1. Create a Supabase account at https://supabase.com (if you don't have one)
2. Create a new project (or use an existing one)

## Step-by-Step Guide

### Step 1: Access Your Project
1. Go to https://supabase.com
2. Log in to your account
3. Click on your project (or create a new one if needed)

### Step 2: Get API Keys (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)

1. **In the left sidebar**, click on the **Settings** icon (⚙️ gear icon)
2. In the Settings menu, click on **"API"** (under Project Settings)
3. You'll see a page with your API credentials:

   **What you'll see:**
   - **Project URL**: This is your `NEXT_PUBLIC_SUPABASE_URL`
     - Format: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public** key: This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - Long JWT token starting with `eyJ...`
     - Click the "Reveal" button or eye icon to see it
   - **service_role secret** key: This is your `SUPABASE_SERVICE_ROLE_KEY`
     - Long JWT token starting with `eyJ...`
     - Click the "Reveal" button or eye icon to see it
     - ⚠️ **WARNING**: This key bypasses Row Level Security - keep it secret!

4. **Copy each value:**
   - Click the copy icon (📋) next to each value
   - Or select and copy manually

### Step 3: Get Database Connection String (DATABASE_URL)

1. **In the left sidebar**, click on **Settings** (⚙️ gear icon)
2. In the Settings menu, click on **"Database"** (under Project Settings)
3. Scroll down to the **"Connection string"** section
4. You'll see different connection string formats and connection modes:
   - **Connection mode**: Transaction (recommended) or Session
   - **Connection pooler**: Use this if you see "Not IPv4 compatible" message
   - **Direct connection**: Only works on IPv6 networks

5. **Important for IPv4 Networks:**
   - If you see "Not IPv4 compatible" or "Use Session Pooler if on a IPv4 network"
   - You **MUST** use the **Connection pooler** connection string
   - The pooler uses port **6543** (not 5432)
   - Format: `postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

6. **Click on the "URI" tab** (or "Connection pooler" tab if available)
7. **Select "Transaction" mode** (recommended) or "Session" mode
8. You'll see a connection string like:
   ```
   # Connection Pooler (for IPv4 networks - USE THIS)
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   
   # Direct Connection (IPv6 only - won't work on IPv4)
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

9. **Important**: The connection string will have `[YOUR-PASSWORD]` placeholder
   - You need to replace this with the **database password** you set when creating the project
   - If you forgot it, you can reset it in Settings > Database > Database password

10. **Copy the Connection Pooler connection string** and replace `[YOUR-PASSWORD]` with your actual password
    - This becomes your `DATABASE_URL`
    - Make sure it includes `pooler.supabase.com:6543` (not `db.supabase.co:5432`)

### Step 4: Update Your .env.local File

Open `infin8content/.env.local` and update with your values:

```bash
# Replace these with your actual values from Supabase dashboard

# From Settings > API > Project URL
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# From Settings > API > anon public key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# From Settings > API > service_role secret key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# From Settings > Database > Connection string (URI) - replace [YOUR-PASSWORD]
DATABASE_URL=postgresql://postgres:your-actual-password@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

## Visual Navigation Path

```
Supabase Dashboard
├── Your Project
    └── Left Sidebar
        └── Settings (⚙️)
            ├── API
            │   ├── Project URL → NEXT_PUBLIC_SUPABASE_URL
            │   ├── anon public → NEXT_PUBLIC_SUPABASE_ANON_KEY
            │   └── service_role → SUPABASE_SERVICE_ROLE_KEY
            │
            └── Database
                └── Connection string (URI tab) → DATABASE_URL
                    (replace [YOUR-PASSWORD] with actual password)
```

## Quick Copy Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Settings > API > Project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Settings > API > anon public (click Reveal)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Settings > API > service_role (click Reveal)
- [ ] `DATABASE_URL` - Settings > Database > Connection string (URI tab) + replace password

## Security Reminders

⚠️ **Never commit these to git:**
- `.env.local` is already in `.gitignore` ✅
- `SUPABASE_SERVICE_ROLE_KEY` bypasses all security - keep it secret!
- `DATABASE_URL` contains your database password - keep it secret!
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe for client-side (it's public)

## Troubleshooting

### Can't find Settings?
- Make sure you're logged in
- Make sure you've selected a project (not just on the projects list page)
- Settings icon is in the left sidebar, usually near the bottom

### Keys are hidden/not visible?
- Click the "Reveal" button or eye icon (👁️) next to the key
- Some keys are hidden by default for security

### Forgot database password?
- Go to Settings > Database
- Scroll to "Database password" section
- Click "Reset database password"
- Update your `DATABASE_URL` with the new password

### "Not IPv4 compatible" or "Use Session Pooler" message?
- **This is normal!** Supabase free tier uses IPv6 by default
- **Solution**: Use the **Connection Pooler** connection string (port 6543)
- Look for connection string with `pooler.supabase.com:6543` (not `db.supabase.co:5432`)
- Select "Transaction" mode in the connection string settings
- The pooler connection string will work on IPv4 networks

### Connection string not working?
- Make sure you replaced `[YOUR-PASSWORD]` with your actual password
- Check that the URL format matches exactly (no extra spaces)
- Verify your project is active (not paused)
- **If on IPv4 network**: Make sure you're using the pooler connection (port 6543)
- **If using pooler**: Make sure connection string includes `pooler.supabase.com:6543`

## Alternative: Using Supabase CLI

If you prefer command line:

```bash
# Link your project
cd infin8content
supabase link --project-ref your-project-ref

# Get connection info
supabase status
```

But the dashboard method above is usually easier for first-time setup.

