/**
 * Stripe Setup Verification Script
 * 
 * Verifies that all required Stripe environment variables are set correctly
 */

// Load environment variables (Next.js automatically loads .env.local)
require('dotenv').config({ path: '.env.local' })

console.log('🔍 Verifying Stripe Setup...\n')
console.log('=' .repeat(50))

const checks = {
  required: [],
  optional: [],
  errors: [],
  warnings: [],
}

// Check STRIPE_SECRET_KEY
const secretKey = process.env.STRIPE_SECRET_KEY
if (!secretKey) {
  checks.errors.push('STRIPE_SECRET_KEY is missing')
} else if (!secretKey.startsWith('sk_test_')) {
  checks.warnings.push('STRIPE_SECRET_KEY should start with "sk_test_" for test mode')
  checks.required.push({ name: 'STRIPE_SECRET_KEY', status: '⚠️  Set but not test mode', value: secretKey.substring(0, 20) + '...' })
} else {
  checks.required.push({ name: 'STRIPE_SECRET_KEY', status: '✅ Valid test key', value: secretKey.substring(0, 20) + '...' })
}

// Check NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
if (!publishableKey) {
  checks.errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing')
} else if (!publishableKey.startsWith('pk_test_')) {
  checks.warnings.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY should start with "pk_test_" for test mode')
  checks.required.push({ name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', status: '⚠️  Set but not test mode', value: publishableKey.substring(0, 20) + '...' })
} else {
  checks.required.push({ name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', status: '✅ Valid test key', value: publishableKey.substring(0, 20) + '...' })
}

// Check STRIPE_WEBHOOK_SECRET
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
if (!webhookSecret) {
  checks.errors.push('STRIPE_WEBHOOK_SECRET is missing')
} else if (!webhookSecret.startsWith('whsec_')) {
  checks.warnings.push('STRIPE_WEBHOOK_SECRET should start with "whsec_"')
  checks.required.push({ name: 'STRIPE_WEBHOOK_SECRET', status: '⚠️  Invalid format', value: webhookSecret.substring(0, 20) + '...' })
} else {
  checks.required.push({ name: 'STRIPE_WEBHOOK_SECRET', status: '✅ Valid webhook secret', value: webhookSecret.substring(0, 20) + '...' })
}

// Check NEXT_PUBLIC_APP_URL
const appUrl = process.env.NEXT_PUBLIC_APP_URL
if (!appUrl) {
  checks.errors.push('NEXT_PUBLIC_APP_URL is missing')
} else {
  checks.required.push({ name: 'NEXT_PUBLIC_APP_URL', status: '✅ Set', value: appUrl })
}

// Check Price IDs (optional but recommended)
const priceIds = {
  'STRIPE_PRICE_STARTER_MONTHLY': process.env.STRIPE_PRICE_STARTER_MONTHLY,
  'STRIPE_PRICE_STARTER_ANNUAL': process.env.STRIPE_PRICE_STARTER_ANNUAL,
  'STRIPE_PRICE_PRO_MONTHLY': process.env.STRIPE_PRICE_PRO_MONTHLY,
  'STRIPE_PRICE_PRO_ANNUAL': process.env.STRIPE_PRICE_PRO_ANNUAL,
  'STRIPE_PRICE_AGENCY_MONTHLY': process.env.STRIPE_PRICE_AGENCY_MONTHLY,
  'STRIPE_PRICE_AGENCY_ANNUAL': process.env.STRIPE_PRICE_AGENCY_ANNUAL,
}

Object.entries(priceIds).forEach(([key, value]) => {
  if (!value || value.startsWith('price_xxx') || value.startsWith('price_yyy')) {
    checks.optional.push({ name: key, status: '⚠️  Not set (using placeholder)', value: 'Will need to be set for payments to work' })
  } else if (!value.startsWith('price_')) {
    checks.optional.push({ name: key, status: '⚠️  Invalid format', value: value.substring(0, 20) + '...' })
  } else {
    checks.optional.push({ name: key, status: '✅ Set', value: value.substring(0, 20) + '...' })
  }
})

// Display results
console.log('\n📋 Required Variables:')
console.log('-'.repeat(50))
checks.required.forEach(item => {
  console.log(`${item.status} ${item.name}`)
  if (item.value) console.log(`   Value: ${item.value}`)
})

if (checks.optional.length > 0) {
  console.log('\n📋 Optional Variables (Price IDs):')
  console.log('-'.repeat(50))
  checks.optional.forEach(item => {
    console.log(`${item.status} ${item.name}`)
    if (item.value) console.log(`   ${item.value}`)
  })
}

if (checks.errors.length > 0) {
  console.log('\n❌ Errors:')
  console.log('-'.repeat(50))
  checks.errors.forEach(error => console.log(`   • ${error}`))
}

if (checks.warnings.length > 0) {
  console.log('\n⚠️  Warnings:')
  console.log('-'.repeat(50))
  checks.warnings.forEach(warning => console.log(`   • ${warning}`))
}

// Final summary
console.log('\n' + '='.repeat(50))
if (checks.errors.length > 0) {
  console.log('❌ Setup incomplete - Please fix the errors above')
  process.exit(1)
} else if (checks.warnings.length > 0) {
  console.log('⚠️  Setup complete with warnings - Review warnings above')
  process.exit(0)
} else {
  console.log('✅ All required Stripe variables are set correctly!')
  if (checks.optional.some(item => item.status.includes('⚠️'))) {
    console.log('💡 Note: Price IDs are not set - You\'ll need to create products in Stripe Dashboard')
  }
  process.exit(0)
}

