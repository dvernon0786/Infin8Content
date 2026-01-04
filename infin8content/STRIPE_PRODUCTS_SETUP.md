# Stripe Products and Prices Setup Guide

This guide explains how to create products and prices in Stripe Dashboard for the subscription plans.

## Overview

The application requires three subscription plans, each with monthly and annual pricing options:

- **Starter Plan**: $89/month or $708/year ($59/month × 12)
- **Pro Plan**: $220/month or $2,100/year ($175/month × 12)
- **Agency Plan**: $399/month or $3,588/year ($299/month × 12)

## Prerequisites

1. Stripe account created (see `STRIPE_SETUP.md`)
2. Stripe Dashboard access in **Test Mode** (toggle in top right)
3. API keys configured (see `STRIPE_SETUP.md`)

## Step-by-Step Setup

### Step 1: Create Products

1. **Navigate to Products**:
   - Go to [Stripe Dashboard](https://dashboard.stripe.com)
   - Click "Products" in the left sidebar
   - Click "Add product" button

2. **Create Starter Plan Product**:
   - **Name**: `Starter Plan`
   - **Description**: `Starter subscription plan with basic features`
   - **Metadata** (optional but recommended):
     - Key: `plan_type`, Value: `starter`
     - Key: `features`, Value: `10 articles/month, 50 keyword researches/month, 1 CMS connection`
   - Click "Save product"
   - **Note the Product ID** (starts with `prod_...`) - you'll need this for reference

3. **Create Pro Plan Product**:
   - Click "Add product" again
   - **Name**: `Pro Plan`
   - **Description**: `Pro subscription plan with advanced features`
   - **Metadata**:
     - Key: `plan_type`, Value: `pro`
     - Key: `features`, Value: `50 articles/month, 500 keyword researches/month, 3 CMS connections`
   - Click "Save product"

4. **Create Agency Plan Product**:
   - Click "Add product" again
   - **Name**: `Agency Plan`
   - **Description**: `Agency subscription plan with unlimited features`
   - **Metadata**:
     - Key: `plan_type`, Value: `agency`
     - Key: `features`, Value: `Unlimited articles, unlimited keyword researches, unlimited CMS connections`
   - Click "Save product"

### Step 2: Create Prices for Each Product

For each product, you need to create **two prices**: one for monthly billing and one for annual billing.

#### Starter Plan Prices

1. **Click on "Starter Plan" product** to open it
2. **Add Monthly Price**:
   - Click "Add price" button
   - **Pricing model**: "Standard pricing"
   - **Price**: `$89.00` (USD)
   - **Billing period**: "Monthly"
   - **Recurring**: Enabled (this is a subscription)
   - Click "Add price"
   - **Copy the Price ID** (starts with `price_...`) → This is `STRIPE_PRICE_STARTER_MONTHLY`

3. **Add Annual Price**:
   - Click "Add price" again
   - **Pricing model**: "Standard pricing"
   - **Price**: `$708.00` (USD) - This is $59/month × 12 months
   - **Billing period**: "Yearly"
   - **Recurring**: Enabled
   - Click "Add price"
   - **Copy the Price ID** → This is `STRIPE_PRICE_STARTER_ANNUAL`

#### Pro Plan Prices

1. **Click on "Pro Plan" product**
2. **Monthly Price**: `$220.00` → `STRIPE_PRICE_PRO_MONTHLY`
3. **Annual Price**: `$2,100.00` ($175/month × 12) → `STRIPE_PRICE_PRO_ANNUAL`

#### Agency Plan Prices

1. **Click on "Agency Plan" product**
2. **Monthly Price**: `$399.00` → `STRIPE_PRICE_AGENCY_MONTHLY`
3. **Annual Price**: `$3,588.00` ($299/month × 12) → `STRIPE_PRICE_AGENCY_ANNUAL`

### Step 3: Update Environment Variables

After creating all prices, update your `.env.local` file with the actual Price IDs:

```bash
# Stripe Price IDs (Required - replace with actual Price IDs from Stripe Dashboard)
STRIPE_PRICE_STARTER_MONTHLY=price_1abc123...
STRIPE_PRICE_STARTER_ANNUAL=price_1def456...
STRIPE_PRICE_PRO_MONTHLY=price_1ghi789...
STRIPE_PRICE_PRO_ANNUAL=price_1jkl012...
STRIPE_PRICE_AGENCY_MONTHLY=price_1mno345...
STRIPE_PRICE_AGENCY_ANNUAL=price_1pqr678...
```

**Important Notes**:
- Price IDs start with `price_...` (not `prod_...` which are Product IDs)
- Use **test mode** Price IDs for development
- Price IDs are different in test mode vs live mode
- Restart your development server after updating environment variables

### Step 4: Verify Setup

1. **Restart development server**:
   ```bash
   npm run dev
   ```

2. **Test price ID retrieval**:
   - Navigate to `/payment` page
   - Select different plans and billing frequencies
   - Check browser console for any errors related to invalid price IDs

3. **Test checkout flow**:
   - Select a plan and click "Subscribe"
   - You should be redirected to Stripe Checkout
   - If you see "Invalid price ID" error, verify the Price IDs in `.env.local`

## Price ID Format

Price IDs follow this format:
- Test mode: `price_1abc123def456...` (starts with `price_1`)
- Live mode: `price_1xyz789...` (also starts with `price_1` but different values)

**Never mix test and live mode Price IDs!**

## Updating Prices

If you need to change prices in the future:

1. **In Stripe Dashboard**:
   - Create new prices with updated amounts
   - Archive old prices (don't delete - needed for existing subscriptions)

2. **Update `.env.local`**:
   - Replace Price IDs with new ones
   - Restart development server

3. **Update `lib/stripe/prices.ts`** (if needed):
   - The file already uses environment variables, so no code changes needed
   - If you want to add fallback values, update the file

## Troubleshooting

### "Invalid price ID" error

- Verify Price IDs are copied correctly (no extra spaces)
- Ensure you're using **test mode** Price IDs (not live mode)
- Check that prices are created in Stripe Dashboard
- Restart server after updating `.env.local`

### Price not found in Stripe

- Verify the Price ID exists in Stripe Dashboard
- Check that you're in the correct mode (test vs live)
- Ensure the price is not archived or deleted

### Wrong price amount displayed

- Verify the price amount in Stripe Dashboard matches expected values
- Check that you're using the correct Price ID (monthly vs annual)

## Code Reference

The Price IDs are used in:
- `lib/stripe/prices.ts` - Type-safe price ID mapping
- `app/api/payment/create-checkout-session/route.ts` - Checkout session creation

## Related Documentation

- `STRIPE_SETUP.md` - Initial Stripe setup and API keys
- `README.md` - General project setup

## Next Steps

After setting up products and prices:

1. Test the complete payment flow
2. Verify webhook processing
3. Test with different plans and billing frequencies
4. When ready for production, create products/prices in **live mode** and update environment variables

