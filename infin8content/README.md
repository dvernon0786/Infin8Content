This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Stripe Setup (Payment Integration)

This project uses Stripe for payment processing. To set up Stripe in test mode:

1. **Create a Stripe account** (free): [https://stripe.com](https://stripe.com)
2. **Get your test mode API keys** from Stripe Dashboard → Developers → API keys
3. **Create products and prices** in Stripe Dashboard (see STRIPE_SETUP.md for details)
4. **Add environment variables** to `.env.local`:
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_STARTER_MONTHLY=price_...
   STRIPE_PRICE_STARTER_ANNUAL=price_...
   STRIPE_PRICE_PRO_MONTHLY=price_...
   STRIPE_PRICE_PRO_ANNUAL=price_...
   STRIPE_PRICE_AGENCY_MONTHLY=price_...
   STRIPE_PRICE_AGENCY_ANNUAL=price_...
   ```

See [STRIPE_SETUP.md](./STRIPE_SETUP.md) for detailed instructions, test card numbers, and webhook setup.

## Supabase Setup

This project uses Supabase for database and authentication. To set up Supabase:

1. **Create a Supabase project** (or use local development):
   - For hosted: Create a project at [supabase.com](https://supabase.com)
   - For local: Run `supabase start` (requires Docker)

2. **Configure environment variables**:
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase project credentials:
     - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
     - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - **Note**: Environment variables are automatically validated on app startup. If any are missing, the app will fail to start with a clear error message.

3. **Link to Supabase project** (if using hosted):
   ```bash
   supabase link --project-ref <project-ref>
   ```

4. **Run migrations**:
   ```bash
   # For local development
   supabase db reset
   
   # Or apply migrations to hosted project
   supabase migration up
   ```

5. **Generate TypeScript types**:
   ```bash
   # Recommended: Using database script (works with DATABASE_URL)
   cd infin8content
   npx tsx scripts/generate-types.ts
   
   # Alternative: For local development with Supabase CLI
   supabase gen types typescript --local > lib/supabase/database.types.ts
   
   # Alternative: For hosted project (requires CLI project access)
   supabase gen types typescript --project-id <project-ref> > lib/supabase/database.types.ts
   ```
   
   **Note:** The script method is recommended as it works reliably without requiring CLI project access privileges. Make sure `DATABASE_URL` is set in `.env.local`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
