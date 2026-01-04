# Stripe Setup Guide (Test Mode)

This guide explains how to set up Stripe in **test mode** for local development and testing.

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Test Mode Keys (Required)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL (Required for redirect URLs)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Stripe Price IDs (if you want to override defaults)
# These will be set after creating products in Stripe Dashboard
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_ANNUAL=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...
STRIPE_PRICE_AGENCY_MONTHLY=price_...
STRIPE_PRICE_AGENCY_ANNUAL=price_...
```

## Getting Your Stripe Test Mode Keys

### Step 1: Create/Login to Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Sign up for a free account (or login if you have one)
3. Complete account setup

### Step 2: Get API Keys (Test Mode)

1. **Open Stripe Dashboard**: [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. **Toggle to Test Mode**: Click the toggle in the top right (should say "Test mode" when active)
3. **Navigate to Developers → API keys**:
   - Click "Developers" in the left sidebar
   - Click "API keys"
4. **Copy your keys**:
   - **Publishable key**: Starts with `pk_test_...` → Use for `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key**: Click "Reveal test key" → Starts with `sk_test_...` → Use for `STRIPE_SECRET_KEY`
   - ⚠️ **Never commit secret keys to git!**

### Step 3: Get Webhook Secret (For Webhook Testing)

1. **Navigate to Developers → Webhooks**:
   - Click "Developers" in the left sidebar
   - Click "Webhooks"
2. **Add endpoint** (for local testing):
   - Click "Add endpoint"
   - Endpoint URL: `http://localhost:3000/api/webhooks/stripe` (or your local URL)
   - Select events to listen to:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
     - `invoice.payment_succeeded`
   - Click "Add endpoint"
3. **Copy webhook signing secret**:
   - Click on the endpoint you just created
   - Click "Reveal" next to "Signing secret"
   - Copy the secret (starts with `whsec_...`) → Use for `STRIPE_WEBHOOK_SECRET`

**Alternative for Local Testing**: Use Stripe CLI to forward webhooks locally (see "Testing Webhooks Locally" section below)

## Creating Products and Prices in Stripe Dashboard

Before you can process payments, you need to create products and prices in Stripe:

### Step 1: Create Products

1. **Navigate to Products**:
   - Click "Products" in the left sidebar
   - Click "Add product"
2. **Create Starter Plan**:
   - Name: "Starter Plan"
   - Description: "Starter subscription plan"
   - Click "Save product"
3. **Create Pro Plan**:
   - Repeat for "Pro Plan"
4. **Create Agency Plan**:
   - Repeat for "Agency Plan"

### Step 2: Create Prices for Each Product

For each product, create two prices (monthly and annual):

**Starter Plan Prices:**
1. Click on "Starter Plan" product
2. Click "Add price"
3. **Monthly Price**:
   - Pricing model: "Standard pricing"
   - Price: `$89.00`
   - Billing period: "Monthly"
   - Click "Add price"
   - Copy the Price ID (starts with `price_...`) → Use for `STRIPE_PRICE_STARTER_MONTHLY`
4. **Annual Price**:
   - Click "Add price" again
   - Price: `$708.00` (which is $59/month × 12)
   - Billing period: "Yearly"
   - Click "Add price"
   - Copy the Price ID → Use for `STRIPE_PRICE_STARTER_ANNUAL`

**Pro Plan Prices:**
- Monthly: `$220.00` → `STRIPE_PRICE_PRO_MONTHLY`
- Annual: `$2,100.00` ($175/month × 12) → `STRIPE_PRICE_PRO_ANNUAL`

**Agency Plan Prices:**
- Monthly: `$399.00` → `STRIPE_PRICE_AGENCY_MONTHLY`
- Annual: `$3,588.00` ($299/month × 12) → `STRIPE_PRICE_AGENCY_ANNUAL`

### Step 3: Update Environment Variables

After creating all prices, update your `.env.local` with the actual Price IDs:

```bash
STRIPE_PRICE_STARTER_MONTHLY=price_1abc123...
STRIPE_PRICE_STARTER_ANNUAL=price_1def456...
STRIPE_PRICE_PRO_MONTHLY=price_1ghi789...
STRIPE_PRICE_PRO_ANNUAL=price_1jkl012...
STRIPE_PRICE_AGENCY_MONTHLY=price_1mno345...
STRIPE_PRICE_AGENCY_ANNUAL=price_1pqr678...
```

**Note**: If you don't set these, the code will use placeholder values (`price_xxx`, etc.) which will cause errors. You must set actual Price IDs from Stripe.

## Testing Webhooks Locally

### Option 1: Stripe CLI (Recommended for Local Development)

1. **Install Stripe CLI**:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Linux
   # Download from https://github.com/stripe/stripe-cli/releases
   
   # Windows
   # Download from https://github.com/stripe/stripe-cli/releases
   ```

2. **Login to Stripe CLI**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. **Copy the webhook signing secret**:
   - The CLI will output: `Ready! Your webhook signing secret is whsec_...`
   - Copy this secret → Use for `STRIPE_WEBHOOK_SECRET` in `.env.local`

5. **Trigger test events**:
   ```bash
   # Trigger a test checkout.session.completed event
   stripe trigger checkout.session.completed
   ```

### Option 2: Stripe Dashboard Webhook Endpoint

Use the webhook endpoint you created in Step 3 above. For local testing, you'll need to use a tool like [ngrok](https://ngrok.com) to expose your local server:

1. **Install ngrok**:
   ```bash
   # macOS
   brew install ngrok
   ```

2. **Expose local server**:
   ```bash
   ngrok http 3000
   ```

3. **Update webhook endpoint URL** in Stripe Dashboard to use the ngrok URL:
   - Example: `https://abc123.ngrok.io/api/webhooks/stripe`

## Test Card Numbers

Stripe provides test card numbers for testing payments in test mode:

### Successful Payments

- **Visa**: `4242 4242 4242 4242`
- **Visa (debit)**: `4000 0566 5566 5556`
- **Mastercard**: `5555 5555 5555 4444`
- **American Express**: `3782 822463 10005`

**Use any:**
- Future expiry date (e.g., `12/34`)
- Any 3-digit CVC
- Any ZIP code (for US cards)

### Declined Payments (For Testing Error Handling)

- **Card declined**: `4000 0000 0000 0002`
- **Insufficient funds**: `4000 0000 0000 9995`
- **Lost card**: `4000 0000 0000 9987`
- **Stolen card**: `4000 0000 0000 9979`

### 3D Secure Authentication

- **Requires authentication**: `4000 0027 6000 3184`
- **Authentication fails**: `4000 0000 0000 3055`

## Complete .env.local Example

```bash
# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
BREVO_API_KEY=your-brevo-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe Test Mode (add these)
STRIPE_SECRET_KEY=sk_test_51abc123...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51def456...
STRIPE_WEBHOOK_SECRET=whsec_789ghi...

# Stripe Price IDs (after creating products in Stripe Dashboard)
STRIPE_PRICE_STARTER_MONTHLY=price_1abc123...
STRIPE_PRICE_STARTER_ANNUAL=price_1def456...
STRIPE_PRICE_PRO_MONTHLY=price_1ghi789...
STRIPE_PRICE_PRO_ANNUAL=price_1jkl012...
STRIPE_PRICE_AGENCY_MONTHLY=price_1mno345...
STRIPE_PRICE_AGENCY_ANNUAL=price_1pqr678...
```

## Verification

After setting up your environment variables:

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Check for validation errors**: The app will fail to start if required Stripe variables are missing

3. **Test the payment flow**:
   - Navigate to `/payment` page
   - Select a plan
   - Use test card `4242 4242 4242 4242` with any future expiry date
   - Complete checkout
   - Verify webhook processes the payment

## Important Notes

- ✅ **Test mode keys** start with `sk_test_` and `pk_test_`
- ✅ **Test mode** doesn't charge real money
- ✅ **Test mode data** is separate from live mode data
- ⚠️ **Never commit** `.env.local` to git (it's in `.gitignore`)
- ⚠️ **Never use** test keys in production
- ⚠️ **Switch to live mode** and use live keys when deploying to production

## Troubleshooting

### "Missing required Stripe environment variables" error

- Check that all three required variables are set in `.env.local`
- Restart the development server after adding variables
- Verify variable names match exactly (case-sensitive)

### "Invalid API Key" error

- Ensure you're using **test mode** keys (start with `sk_test_` and `pk_test_`)
- Verify the keys are copied completely (no extra spaces)
- Check that you're in **Test mode** in Stripe Dashboard (toggle in top right)

### Webhook not receiving events

- Verify `STRIPE_WEBHOOK_SECRET` matches the secret from Stripe Dashboard or Stripe CLI
- Check that webhook endpoint URL is correct
- For local testing, use Stripe CLI (`stripe listen`) or ngrok
- Check server logs for webhook processing errors

### "Invalid price ID" error

- Verify you've created products and prices in Stripe Dashboard
- Copy the actual Price IDs (not placeholder values)
- Ensure Price IDs are from **test mode** (not live mode)
- Restart server after updating Price ID environment variables

## Next Steps

Once test mode is working:

1. Test the complete payment flow
2. Test webhook processing
3. Test error scenarios (declined cards, etc.)
4. When ready for production, switch to **live mode** in Stripe Dashboard and use live keys

## Resources

- [Stripe Test Mode Documentation](https://stripe.com/docs/testing)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)

