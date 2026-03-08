/**
 * Migration: add_section_image_url
 *
 * Adds image URL columns to article_sections and articles.
 *
 * Prerequisites:
 *   DATABASE_URL must be set in .env.local
 *   Get it from: Supabase Dashboard → Project Settings → Database → Connection string (URI)
 *
 * Run:
 *   npx tsx scripts/migrate-images.ts
 */

import { Client } from 'pg'   // FIX 7: top-level ESM import, not require()
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SQL_STATEMENTS = [
    // FIX 1+2: All statements here — no RPC path, single source of truth
    `ALTER TABLE article_sections ADD COLUMN IF NOT EXISTS section_image_url TEXT`,
    `ALTER TABLE articles ADD COLUMN IF NOT EXISTS cover_image_url TEXT`,
    // FIX 5: COMMENT statements included
    `COMMENT ON COLUMN article_sections.section_image_url IS 'URL of AI-generated inline image for this section (Riverflow V2 Fast or GPT-Image-1 Mini)'`,
    `COMMENT ON COLUMN articles.cover_image_url IS 'URL of AI-generated hero/cover image (Seedream 4.5)'`,
]

async function runMigration() {
    const connectionString = process.env.DATABASE_URL

    // FIX 4: Hard fail with non-zero exit if DATABASE_URL missing
    if (!connectionString) {
        console.error(
            'ERROR: DATABASE_URL not set in .env.local\n' +
            'Get it from: Supabase Dashboard → Project Settings → Database → Connection string (URI mode)'
        )
        process.exit(1)
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
    })

    try {
        await client.connect()
        console.log('Connected to database.')

        for (const sql of SQL_STATEMENTS) {
            await client.query(sql)
            console.log(`✅ ${sql.slice(0, 80)}...`)
        }

        console.log('\nMigration completed successfully.')
    } catch (err) {
        console.error('Migration failed:', err)
        process.exit(1)   // FIX 3: Non-zero exit so CI/CD detects failure
    } finally {
        await client.end()
    }
}

runMigration()
