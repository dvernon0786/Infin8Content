/**
 * lib/inngest/functions/llm-visibility-tracker.ts
 *
 * Two Inngest functions:
 *   1. llmVisibilityDailyCron  — fires at 06:00 UTC daily, runs all active projects
 *   2. llmVisibilityRerun      — manual trigger per project (rate-limited)
 *
 * Each function:
 *   - Loads project + prompts + models
 *   - Runs each prompt × model via OpenRouter
 *   - Stores results in llm_visibility_runs (idempotent upsert)
 *   - Aggregates daily snapshot into llm_visibility_snapshots
 *   - Updates project.last_run_at
 */

import { inngest } from '../client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import {
  runPromptAgainstModel,
  aggregateSnapshot,
  type ProjectConfig,
} from '@/lib/services/llm-visibility/visibility-engine'

// ── Shared runner ─────────────────────────────────────────────────────────────

async function runProjectTracking(
  step: any,
  projectId: string,
) {
  const supabase = createServiceRoleClient()

  // Step 1: Load project + prompts
  const { project, prompts } = await step.run('load-project', async () => {
    const { data: proj, error: projErr } = await supabase
      .from('llm_visibility_projects')
      .select('*')
      .eq('id', projectId)
      .eq('is_active', true)
      .single()

    if (projErr || !proj) throw new Error(`Project ${projectId} not found or inactive`)

    const { data: promptRows } = await supabase
      .from('llm_visibility_prompts')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)

    return { project: proj, prompts: promptRows ?? [] }
  })

  if (prompts.length === 0) {
    return { skipped: true, reason: 'no active prompts' }
  }

  const projectConfig: ProjectConfig = {
    brandName: project.brand_name,
    brandAliases: project.brand_aliases ?? [],
    competitors: project.competitors ?? [],
  }

  const models: string[] = project.models ?? ['openai/gpt-4o-mini', 'perplexity/sonar']
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  // Step 2: Run each prompt × model in isolated steps for durability
  const allRunResults: Array<{
    promptId: string
    category: string
    model: string
    mentioned: boolean
    sentiment: string | null
    position: string
    citedUrls: string[]
    competitorMentions: Record<string, boolean>
    rawResponse: string
  }> = []

  for (const prompt of prompts) {
    for (const model of models) {
      const stepKey = `run-${prompt.id}-${model.replace(/\//g, '-')}`

      const result = await step.run(stepKey, async () => {
        // Idempotency: skip if already run today
        const { data: existing } = await supabase
          .from('llm_visibility_runs')
          .select('id')
          .eq('prompt_id', prompt.id)
          .eq('model', model)
          .eq('run_date', today)
          .maybeSingle()

        if (existing) {
          return { skipped: true, promptId: prompt.id, model }
        }

        const runResult = await runPromptAgainstModel(
          prompt.prompt_text,
          model,
          projectConfig,
        )

        // Persist run
        await supabase.from('llm_visibility_runs').upsert(
          {
            project_id: projectId,
            organization_id: project.organization_id,
            prompt_id: prompt.id,
            model,
            run_date: today,
            raw_response: runResult.rawResponse,
            mentioned: runResult.mentioned,
            position: runResult.position,
            sentiment: runResult.sentiment,
            cited_urls: runResult.citedUrls,
            competitor_mentions: runResult.competitorMentions,
          },
          { onConflict: 'prompt_id,model,run_date' },
        )

        return {
          skipped: false,
          promptId: prompt.id,
          category: prompt.category,
          model,
          mentioned: runResult.mentioned,
          sentiment: runResult.sentiment,
          position: runResult.position,
          citedUrls: runResult.citedUrls,
          competitorMentions: runResult.competitorMentions,
          rawResponse: runResult.rawResponse,
        }
      })

      if (!result.skipped) {
        allRunResults.push(result as any)
      }
    }
  }

  // Step 3: Aggregate snapshot
  await step.run('aggregate-snapshot', async () => {
    // Pull today's full run set (includes any pre-existing runs that were skipped above)
    const { data: todayRuns } = await supabase
      .from('llm_visibility_runs')
      .select(`
        mentioned, sentiment, model, position, competitor_mentions,
        llm_visibility_prompts!inner(category)
      `)
      .eq('project_id', projectId)
      .eq('run_date', today)

    if (!todayRuns || todayRuns.length === 0) return

    const runsForAgg = todayRuns.map((r: any) => ({
      mentioned: r.mentioned,
      sentiment: r.sentiment,
      model: r.model,
      category: r.llm_visibility_prompts?.category ?? 'informational',
    }))

    const snap = aggregateSnapshot({ runs: runsForAgg })
    if (!snap) return

    // Build competitor share of voice
    const competitorSov: Record<string, { score: number; delta: number }> = {}
    for (const comp of (project.competitors ?? [])) {
      const compMentions = todayRuns.filter(
        (r: any) => (r as any).competitor_mentions?.[comp.name] === true
      ).length
      const compScore = Number(((compMentions / todayRuns.length) * 100).toFixed(2))

      // Get yesterday's score for delta
      const { data: yesterdaySnapRaw } = await supabase
        .from('llm_visibility_snapshots')
        .select('competitor_sov')
        .eq('project_id', projectId)
        .lt('snapshot_date', today)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .maybeSingle() as unknown as { data: any; error: any }
      const yesterdaySnap = yesterdaySnapRaw as any

      const prevScore = (yesterdaySnap?.competitor_sov as any)?.[comp.name]?.score ?? 0
      competitorSov[comp.name] = {
        score: compScore,
        delta: Number((compScore - prevScore).toFixed(2)),
      }
    }

    await supabase.from('llm_visibility_snapshots').upsert(
      {
        project_id: projectId,
        organization_id: project.organization_id,
        snapshot_date: today,
        visibility_score: snap.visibilityScore,
        total_mentions: snap.totalMentions,
        total_runs: snap.totalRuns,
        sentiment_positive: snap.sentimentPositive,
        sentiment_neutral: snap.sentimentNeutral,
        sentiment_negative: snap.sentimentNegative,
        kpi_ai_search: snap.kpiAiSearch,
        frequency_label: snap.frequencyLabel,
        per_model_stats: snap.perModelStats,
        competitor_sov: competitorSov,
        total_volume: snap.totalVolume,
      },
      { onConflict: 'project_id,snapshot_date' },
    )

    // Update project last_run_at
    await supabase
      .from('llm_visibility_projects')
      .update({ last_run_at: new Date().toISOString() })
      .eq('id', projectId)
  })

  return { success: true, projectId, runsCompleted: allRunResults.length }
}

// ── Function 1: Daily cron ────────────────────────────────────────────────────

export const llmVisibilityDailyCron = inngest.createFunction(
  {
    id: 'llm-visibility/daily-cron',
    name: 'LLM Visibility — Daily Tracking Cron',
    concurrency: { limit: 3, key: 'event.data.projectId' },
  },
  { cron: '0 6 * * *' }, // 06:00 UTC daily
  async ({ step }) => {
    const supabase = createServiceRoleClient()

    // Load all active projects
    const { data: projectsRaw } = await supabase
      .from('llm_visibility_projects')
      .select('id, organization_id')
      .eq('is_active', true) as unknown as { data: Array<{ id: string; organization_id: string }> | null; error: any }
    const projects = projectsRaw as Array<{ id: string; organization_id: string }> | null

    if (!projects || projects.length === 0) return { skipped: true }

    // Fan out — send one event per project so they run in parallel
    await step.sendEvent(
      'fan-out-projects',
      projects.map(p => ({
        name: 'llm-visibility/rerun.requested' as const,
        data: { projectId: p.id, triggeredBy: 'cron' },
      })),
    )

    return { projectsQueued: projects.length }
  },
)

// ── Function 2: Per-project runner (cron fan-out + manual rerun) ──────────────

export const llmVisibilityRerun = inngest.createFunction(
  {
    id: 'llm-visibility/rerun',
    name: 'LLM Visibility — Run Project',
    retries: 2,
    concurrency: { limit: 1, key: 'event.data.projectId' },
    rateLimit: {
      limit: 4,
      period: '24h',
      key: 'event.data.projectId',
    },
  },
  { event: 'llm-visibility/rerun.requested' },
  async ({ event, step }) => {
    const { projectId } = event.data
    return runProjectTracking(step, projectId)
  },
)
