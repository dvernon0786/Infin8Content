import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { validateOnboarding } from '@/lib/onboarding/onboarding-validator'

/**
 * GET /api/debug/sync-onboarding
 * One-shot: re-runs validateOnboarding for all orgs and syncs the onboarding_completed DB flag.
 * DELETE THIS FILE after use.
 */
export async function GET() {
    const supabase = createServiceRoleClient()

    const { data: orgs, error } = await (supabase as any)
        .from('organizations')
        .select('id, onboarding_completed')

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const results = []

    for (const org of orgs || []) {
        const validation = await validateOnboarding(org.id)

        if (validation.valid && !org.onboarding_completed) {
            const now = new Date().toISOString()
            await (supabase as any)
                .from('organizations')
                .update({
                    onboarding_completed: true,
                    onboarding_completed_at: now,
                    onboarding_version: 'v2-authoritative',
                    updated_at: now
                })
                .eq('id', org.id)

            // Also seed the intent engine flag
            await (supabase as any)
                .from('feature_flags')
                .upsert(
                    { organization_id: org.id, flag_key: 'ENABLE_INTENT_ENGINE', enabled: true },
                    { onConflict: 'organization_id,flag_key' }
                )

            results.push({ org_id: org.id, was: false, now: true, missing: [] })
        } else {
            results.push({ org_id: org.id, was: org.onboarding_completed, now: validation.valid, missing: validation.missing })
        }
    }

    return NextResponse.json({ synced: results.filter(r => r.was === false && r.now === true).length, results })
}
