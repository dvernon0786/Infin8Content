import { createClient } from '@supabase/supabase-js'
import { generateSchemaMarkup } from '../lib/services/article-generation/schema-generator'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=')
    if (k && v.length) process.env[k.trim()] = v.join('=').trim()
  })
}

const [, , articleId, orgId] = process.argv
if (!articleId || !orgId) { console.error('Usage: npx tsx scripts/smoke-test-schema.ts <articleId> <orgId>'); process.exit(1) }

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })

async function run() {
  console.log(`\n🔍 Testing article: ${articleId}`)
  const result = await generateSchemaMarkup({ articleId, orgId, supabase: supabase as any })
  console.log('\n✅ Result:', JSON.stringify(result, null, 2))

  const { data, error } = await supabase.from('articles').select('article_plan').eq('id', articleId).single()
  if (error) { console.error('Fetch error:', error.message); return }

  const plan = data?.article_plan as any
  const markup = plan?.schema_markup as string ?? ''
  console.log('\n📋 schema_types:', plan?.schema_types)
  console.log('⏱  schema_generated_at:', plan?.schema_generated_at)
  console.log('\n📄 schema_markup (first 800 chars):\n', markup.slice(0, 800))

  const xssRisk = /<\/script/i.test(markup)
  console.log(`\n🔐 XSS check: ${xssRisk ? '❌ FAIL' : '✅ PASS'}`)
}

run().catch(err => { console.error('FAILED:', err); process.exit(1) })
