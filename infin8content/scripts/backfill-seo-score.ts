import { createClient } from '@supabase/supabase-js'
import { scoreSEO } from '../lib/services/article-generation/seo-scoring-service'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const eq = line.indexOf('=')
    if (eq > 0) process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim()
  })
}

const [, , articleId] = process.argv
if (!articleId) { console.error('Usage: npx tsx scripts/backfill-seo-score.ts <articleId>'); process.exit(1) }

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function run() {
  console.log(`\n🔍 Scoring article: ${articleId}`)
  const result = await scoreSEO({ articleId, supabase: supabase as any })
  console.log('\n✅ Result:', JSON.stringify(result, null, 2))
}

run().catch(err => { console.error('FAILED:', err); process.exit(1) })
