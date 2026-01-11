#!/usr/bin/env node

/**
 * Script to reset SQL editor usage for a specific user
 * Usage: node scripts/reset-sql-usage.js <user-id>
 */

const userId = process.argv[2]

if (!userId) {
  console.error('Usage: node scripts/reset-sql-usage.js <user-id>')
  console.error('Example: node scripts/reset-sql-usage.js e657f06e-772c-4d5c-b3ee-2fcb94463212')
  process.exit(1)
}

console.log(`Resetting SQL usage for user: ${userId}`)

// You can call this via curl or use the API endpoint
console.log('\nTo reset via API, use:')
console.log(`curl -X POST https://your-app.vercel.app/api/admin/reset-sql-usage \\`)
console.log(`  -H "Content-Type: application/json" \\`)
console.log(`  -d '{"userId": "${userId}"}' \\`)
console.log(`  -H "Authorization: Bearer <your-token>"`)

console.log('\nOr directly in the browser console:')
console.log(`fetch('/api/admin/reset-sql-usage', {`)
console.log(`  method: 'POST',`)
console.log(`  headers: { 'Content-Type': 'application/json' },`)
console.log(`  body: JSON.stringify({ userId: '${userId}' })`)
console.log(`}).then(r => r.json()).then(console.log)`)
