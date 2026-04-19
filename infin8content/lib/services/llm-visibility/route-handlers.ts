/**
 * lib/services/llm-visibility/route-handlers.ts
 *
 * Named handler functions for all LLM Visibility API routes.
 * Import these into thin Next.js route files under app/api/llm-visibility/.
 * All handlers use createClient() (RLS-enforced user client).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { inngest } from '@/lib/inngest/client'
import { suggestPrompts } from '@/lib/services/llm-visibility/prompt-suggester'
import { z } from 'zod'

// ═══════════════════════════════════════════════════════════════
// GET  — list projects for org
// POST — create new project + auto-suggest prompts
// ═══════════════════════════════════════════════════════════════

const CreateProjectSchema = z.object({
  brandName: z.string().min(1),
  websiteUrl: z.string().url(),
  brandAliases: z.array(z.string()).default([]),
  businessDescription: z.string().optional(),
  competitors: z.array(z.object({ name: z.string(), domain: z.string() })).default([]),
  models: z.array(z.string()).default(['openai/gpt-4o-mini', 'perplexity/sonar', 'anthropic/claude-3-5-haiku']),
})

export async function GET_projects(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await (supabase
    .from('llm_visibility_projects' as any)
    .select(`
      id, brand_name, website_url, brand_aliases, competitors, models,
      is_active, last_run_at, created_at,
      llm_visibility_snapshots(
        snapshot_date, visibility_score, total_mentions, frequency_label,
        kpi_ai_search, per_model_stats
      )
    `)
    .order('created_at', { ascending: false }) as unknown as Promise<{ data: any[] | null; error: any }>)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST_projects(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profileRaw } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()
  const profile = profileRaw as { organization_id: string | null } | null

  if (!profile?.organization_id) return NextResponse.json({ error: 'No org' }, { status: 422 })
  const orgId = profile.organization_id as string

  let body: z.infer<typeof CreateProjectSchema>
  try { body = CreateProjectSchema.parse(await req.json()) }
  catch (e: any) { return NextResponse.json({ error: e.errors }, { status: 400 }) }

  const { data: projectRaw, error } = await supabase
    .from('llm_visibility_projects' as any)
    .insert({
      organization_id: profile.organization_id,
      brand_name: body.brandName,
      website_url: body.websiteUrl,
      brand_aliases: body.brandAliases,
      business_description: body.businessDescription,
      competitors: body.competitors,
      models: body.models,
    })
    .select()
    .single() as unknown as { data: any; error: any }
  const project = projectRaw as any

  if (error || !project) return NextResponse.json({ error: error?.message }, { status: 500 })

  // Auto-suggest prompts in background (non-blocking)
  suggestPrompts({
    brandName: body.brandName,
    websiteUrl: body.websiteUrl,
    businessDescription: body.businessDescription,
    competitorNames: body.competitors.map(c => c.name),
  }).then(async (suggestions) => {
    const supabaseBg = createServiceRoleClient()
    const rows = suggestions.map(s => ({
      project_id: project.id,
      organization_id: orgId,
      prompt_text: s.promptText,
      category: s.category,
    }))
    await supabaseBg.from('llm_visibility_prompts').insert(rows)
  }).catch(() => {})

  return NextResponse.json({ data: project }, { status: 201 })
}


// ═══════════════════════════════════════════════════════════════
// GET  — list prompts for project
// POST — add prompt(s)
// ═══════════════════════════════════════════════════════════════

const AddPromptSchema = z.object({
  prompts: z.array(z.object({
    promptText: z.string().min(3),
    category: z.enum(['informational', 'commercial', 'competitor']),
  })).min(1),
})

export async function GET_prompts(req: NextRequest, projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await (supabase
    .from('llm_visibility_prompts' as any)
    .select(`
      id, prompt_text, category, is_active, created_at,
      llm_visibility_runs(mentioned, sentiment, model, run_date)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false }) as unknown as Promise<{ data: any[] | null; error: any }>)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST_prompts(req: NextRequest, projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profileRaw2 } = await supabase.from('users').select('organization_id').eq('id', user.id).single()
  const profile = profileRaw2 as { organization_id: string | null } | null
  if (!profile?.organization_id) return NextResponse.json({ error: 'No org' }, { status: 422 })

  let body: z.infer<typeof AddPromptSchema>
  try { body = AddPromptSchema.parse(await req.json()) }
  catch (e: any) { return NextResponse.json({ error: e.errors }, { status: 400 }) }

  const rows = body.prompts.map(p => ({
    project_id: projectId,
    organization_id: profile.organization_id,
    prompt_text: p.promptText,
    category: p.category,
  }))

  const { data, error } = await supabase.from('llm_visibility_prompts').insert(rows).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}


// ═══════════════════════════════════════════════════════════════
// POST — trigger manual re-run (rate-limited by Inngest)
// ═══════════════════════════════════════════════════════════════

export async function POST_rerun(req: NextRequest, projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify project belongs to user's org (RLS handles this)
  const { data: project } = await supabase
    .from('llm_visibility_projects')
    .select('id')
    .eq('id', projectId)
    .single()

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  await inngest.send({
    name: 'llm-visibility/rerun.requested',
    data: { projectId, triggeredBy: user.id },
  })

  return NextResponse.json({ success: true, message: 'Tracking run started' }, { status: 202 })
}


// ═══════════════════════════════════════════════════════════════
// GET — historical snapshots for chart + dashboard
// ═══════════════════════════════════════════════════════════════

export async function GET_snapshots(req: NextRequest, projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const days = Math.min(Number(url.searchParams.get('days') ?? '30'), 90)

  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from('llm_visibility_snapshots')
    .select('*')
    .eq('project_id', projectId)
    .gte('snapshot_date', since.toISOString().slice(0, 10))
    .order('snapshot_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}


// ═══════════════════════════════════════════════════════════════
// GET — per-prompt run detail for drill-down modal
// ═══════════════════════════════════════════════════════════════

export async function GET_runs(req: NextRequest, projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const promptId = url.searchParams.get('promptId')
  const runDate = url.searchParams.get('date') ?? new Date().toISOString().slice(0, 10)

  let query = supabase
    .from('llm_visibility_runs')
    .select('id, model, run_date, mentioned, position, sentiment, cited_urls, competitor_mentions, raw_response')
    .eq('project_id', projectId)
    .eq('run_date', runDate)
    .order('model')

  if (promptId) query = query.eq('prompt_id', promptId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}


// ═══════════════════════════════════════════════════════════════
// POST — re-trigger prompt auto-suggestion
// ═══════════════════════════════════════════════════════════════

export async function POST_suggestPrompts(req: NextRequest, projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: projectRaw } = await supabase
    .from('llm_visibility_projects' as any)
    .select('brand_name, website_url, business_description, competitors')
    .eq('id', projectId)
    .single() as unknown as { data: any; error: any }
  const project = projectRaw as any

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const suggestions = await suggestPrompts({
    brandName: project.brand_name,
    websiteUrl: project.website_url,
    businessDescription: project.business_description,
    competitorNames: (project.competitors as any[])?.map(c => c.name) ?? [],
  })

  return NextResponse.json({ data: suggestions })
}
