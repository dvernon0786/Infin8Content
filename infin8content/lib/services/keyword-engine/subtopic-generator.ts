/**
 * lib/services/keyword-engine/subtopic-generator.ts
 * Epic 37, Story 37.1 — Generate Subtopic Ideas via OpenRouter (LLM only)
 *
 * Generates exactly 3 AI-powered article subtopics per keyword, using ICP
 * context drawn from the parent intent_workflow, then persists results to
 * the keywords table with a WORM-compliant audit log entry.
 *
 * Caller: intent-pipeline.ts → step8Subtopics Inngest function
 * Call pattern (unchanged):
 *   const subtopics = await generator.generate(keyword.id)
 *   await generator.store(keyword.id, subtopics)
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { generateContent, type OpenRouterGenerationResult } from '@/lib/services/openrouter/openrouter-client'
import { getOrganizationGeoOrThrow } from '@/lib/config/dataforseo-geo'
import type { SupabaseClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// Types  (KeywordSubtopic is exported so the Inngest caller can type its locals)
// ─────────────────────────────────────────────────────────────────────────────

export type SubtopicType = 'informational' | 'commercial' | 'transactional' | 'navigational'

export interface KeywordSubtopic {
  title: string
  type: SubtopicType
  keywords: string[]
}

// Matches the explicit columns we SELECT from `keywords` 
interface KeywordRow {
  id: string
  keyword: string
  seed_keyword: string | null
  workflow_id: string | null
  organization_id: string
  longtail_status: string
  subtopics_status: string
  main_intent: string | null       // schema: `main_intent`, NOT `search_intent` 
  search_volume: number | null
  detected_language: string | null
}

// Matches the explicit columns we SELECT from `intent_workflows` 
interface WorkflowRow {
  icp_analysis: Record<string, unknown> | null
}

interface OrganizationGeo {
  locationCode: number
  languageCode: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const SUBTOPIC_COUNT = 3
const AI_TIMEOUT_MS = 15_000
const VALID_TYPES: SubtopicType[] = ['informational', 'commercial', 'transactional', 'navigational']
const FALLBACK_TYPES: SubtopicType[] = ['informational', 'commercial', 'transactional']

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

export class KeywordSubtopicGenerator {
  private readonly supabase: SupabaseClient

  /**
   * Accept an injected client (tests, Inngest context) or create one for
   * production use. Keeps the class testable without live network calls.
   */
  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient ?? createServiceRoleClient()
  }

  // ─── Public API (signatures unchanged — Step 8 worker must not be touched) ─

  /**
   * Generates SUBTOPIC_COUNT subtopics for a keyword via OpenRouter.
   *
   * Validates prerequisites before calling the AI:
   *  - Throws if `longtail_status !== 'completed'` 
   *  - Throws if `subtopics_status === 'completed'` (already done)
   *
   * Returns the subtopic array for the caller to inspect before storing.
   */
  async generate(keywordId: string): Promise<KeywordSubtopic[]> {
    if (!keywordId?.trim()) throw new Error('Keyword ID is required')

    const keyword = await this.fetchKeyword(keywordId)
    this.validateKeywordForGeneration(keyword)

    // `keywords.keyword` holds the long-tail text; `seed_keyword` is the fallback.
    // There is no separate `longtail_keyword` column in the schema.
    const topic = keyword.keyword?.trim() || keyword.seed_keyword?.trim()
    if (!topic) throw new Error(`No valid topic found for keyword ${keywordId}`)

    // Parallel fetches — neither blocks the other
    const [icpAnalysis, geo] = await Promise.all([
      this.fetchIcpAnalysis(keyword.workflow_id),
      this.fetchGeoSettings(keyword.organization_id),
    ])

    const prompt = this.buildPrompt(topic, keyword, icpAnalysis, geo.languageCode)

    const aiResult = await Promise.race([
      generateContent(
        [
          {
            role: 'system',
            content:
              'You are a senior content strategist. ' +
              'Return ONLY valid JSON — no markdown fences, no explanation.',
          },
          { role: 'user', content: prompt },
        ],
        { maxTokens: 900, temperature: 0.2 }
      ),
      this.rejectAfter<OpenRouterGenerationResult>(
        AI_TIMEOUT_MS,
        `OpenRouter timed out after ${AI_TIMEOUT_MS}ms for keyword ${keywordId}` 
      ),
    ])

    if (!aiResult || typeof aiResult.content !== 'string') {
      throw new Error(`Invalid OpenRouter response for keyword ${keywordId}`)
    }

    return this.parseResponse(aiResult.content, topic, geo.languageCode)
  }

  /**
   * Persists subtopics to `keywords.subtopics` and sets
   * `subtopics_status = 'completed'`.
   *
   * Organisation isolation is enforced on the write query.
   * A WORM-compliant audit log entry is written after a successful save.
   */
  async store(keywordId: string, subtopics: KeywordSubtopic[]): Promise<void> {
    if (!keywordId?.trim()) throw new Error('Keyword ID is required')
    if (!subtopics?.length) throw new Error('Subtopics array must not be empty')

    // Re-fetch only the org ID we need for the write guard and audit log
    const { data: kw, error: kwErr } = await this.supabase
      .from('keywords')
      .select('organization_id')
      .eq('id', keywordId)
      .single()

    if (kwErr || !kw) {
      throw new Error(`Keyword ${keywordId} not found when attempting to store: ${kwErr?.message ?? 'no data'}`)
    }

    const organizationId = (kw as { organization_id: string }).organization_id

    const { error } = await this.supabase
      .from('keywords')
      .update({
        subtopics,
        subtopics_status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', keywordId)
      .eq('organization_id', organizationId) // Org isolation enforced on write

    if (error) {
      throw new Error(`Failed to store subtopics for keyword ${keywordId}: ${error.message}`)
    }

    await this.writeAuditLog(organizationId, keywordId, subtopics.length)
  }

  // ─── Prompt ────────────────────────────────────────────────────────────────

  private buildPrompt(
    topic: string,
    keyword: KeywordRow,
    icpAnalysis: Record<string, unknown> | null,
    languageCode: string
  ): string {
    const icpSection = icpAnalysis
      ? JSON.stringify(icpAnalysis, null, 2)
      : 'No ICP data available — apply general B2B content best practices.'

    return `
You are a senior content strategist building an SEO content plan.

Generate EXACTLY ${SUBTOPIC_COUNT} distinct H2 article subtopics for the keyword: "${topic}"

## ICP (Ideal Customer Profile)
${icpSection}

## Keyword context
- Primary intent: ${keyword.main_intent ?? 'informational'}
- Search volume: ${keyword.search_volume ?? 'unknown'}
- Language: ${languageCode}
- Detected language: ${keyword.detected_language ?? languageCode}

## Requirements
1. Return EXACTLY ${SUBTOPIC_COUNT} subtopics — no more, no fewer.
2. Each subtopic must be a concrete, actionable H2 heading — never vague.
3. Each subtopic must address a distinct real-world problem for the ICP.
4. Use a DIFFERENT type for each: one "informational", one "commercial", one "transactional".
5. Write all titles and keywords STRICTLY in "${languageCode}". This is the authoritative output language.
6. Each "keywords" array must contain 1–3 closely related search phrases.

## Output
Return ONLY this JSON — no markdown fences, no explanation:

{
  "subtopics": [
    {
      "title": "<concrete H2 heading>",
      "type": "informational",
      "keywords": ["<phrase 1>", "<phrase 2>"]
    },
    {
      "title": "<concrete H2 heading>",
      "type": "commercial",
      "keywords": ["<phrase 1>", "<phrase 2>"]
    },
    {
      "title": "<concrete H2 heading>",
      "type": "transactional",
      "keywords": ["<phrase 1>"]
    }
  ]
}
`.trim()
  }

  // ─── Response parsing ──────────────────────────────────────────────────────

  private parseResponse(raw: string, topic: string, languageCode: string): KeywordSubtopic[] {
    try {
      const cleaned = raw.replace(/^```(?:json)?|```$/gm, '').trim()
      const parsed = JSON.parse(cleaned) as { subtopics?: unknown[] }

      if (!Array.isArray(parsed?.subtopics) || parsed.subtopics.length === 0) {
        throw new Error('Response missing subtopics array')
      }

      const subtopics: KeywordSubtopic[] = parsed.subtopics
        .slice(0, SUBTOPIC_COUNT)
        .map((item: unknown) => {
          const st = item as Record<string, unknown>
          const title = String(st.title ?? '').trim()
          const rawKws = Array.isArray(st.keywords) ? (st.keywords as unknown[]) : []
          const keywords = rawKws
            .map((k) => String(k).trim())
            .filter((k) => k.length > 0)

          return {
            title: title || topic,
            type: this.normaliseType(st.type),
            keywords: keywords.length > 0 ? keywords : [topic],
          }
        })

      // PATCH 5.1 — Enforce deterministic required types in exact order
      const requiredTypes: SubtopicType[] = ['informational', 'commercial', 'transactional']
      for (let i = 0; i < requiredTypes.length; i++) {
        if (!subtopics[i] || subtopics[i].type !== requiredTypes[i]) {
          subtopics[i] = {
            ...subtopics[i],
            type: requiredTypes[i],
          }
        }
      }

      // PATCH 3 — Language-neutral padding (no English leakage)
      while (subtopics.length < SUBTOPIC_COUNT) {
        const i = subtopics.length
        subtopics.push({
          title: topic,
          type: FALLBACK_TYPES[i],
          keywords: [topic],
        })
      }

      return subtopics
    } catch (err) {
      console.error('[KeywordSubtopicGenerator] AI response parse failed — using fallback', {
        topic,
        error: err instanceof Error ? err.message : String(err),
        rawPreview: raw.slice(0, 200),
      })
      return this.buildFallbackSubtopics(topic, languageCode)
    }
  }

  private buildFallbackSubtopics(topic: string, languageCode: string): KeywordSubtopic[] {
    const baseLang = languageCode.toLowerCase().split('-')[0]

    const templates: Record<string, [string, string, string]> = {
      en: [
        `What is ${topic}?`,
        `${topic}: key benefits and use cases`,
        `How to implement ${topic}: step-by-step`,
      ],
      de: [
        `Was ist ${topic}?`,
        `${topic}: Vorteile und Anwendungsfälle`,
        `Wie implementiert man ${topic}?`,
      ],
      fr: [
        `Qu'est-ce que ${topic} ?`,
        `${topic} : avantages et cas d'usage`,
        `Comment implémenter ${topic} ?`,
      ],
      nl: [
        `Wat is ${topic}?`,
        `${topic}: voordelen en toepassingen`,
        `Hoe implementeer je ${topic}?`,
      ],
      es: [
        `¿Qué es ${topic}?`,
        `${topic}: ventajas y casos de uso`,
        `Cómo implementar ${topic}: paso a paso`,
      ],
    }

    const t = templates[baseLang] ?? templates.en

    return [
      { title: t[0], type: 'informational', keywords: [topic] },
      { title: t[1], type: 'commercial',    keywords: [topic] },
      { title: t[2], type: 'transactional', keywords: [topic] },
    ]
  }

  private normaliseType(raw: unknown): SubtopicType {
    const candidate = String(raw ?? '').toLowerCase().trim() as SubtopicType
    return VALID_TYPES.includes(candidate) ? candidate : 'informational'
  }

  // ─── Database helpers ──────────────────────────────────────────────────────

  /**
   * Fetches only the columns this service needs.
   * NO select('*') — explicit field list per project pattern.
   */
  private async fetchKeyword(keywordId: string): Promise<KeywordRow> {
    const { data, error } = await this.supabase
      .from('keywords')
      .select(
        'id, keyword, seed_keyword, workflow_id, organization_id, ' +
          'longtail_status, subtopics_status, main_intent, search_volume, detected_language'
      )
      .eq('id', keywordId)
      .single()

    if (error || !data) {
      throw new Error(`Keyword ${keywordId} not found: ${error?.message ?? 'no data'}`)
    }

    return data as unknown as KeywordRow
  }

  /**
   * ICP data lives on `intent_workflows.icp_analysis` (JSONB), reached via
   * the keyword's `workflow_id`. There is no separate `icp_profiles` table.
   * Returns null gracefully — the prompt handles the missing-ICP case.
   */
  private async fetchIcpAnalysis(
    workflowId: string | null
  ): Promise<Record<string, unknown> | null> {
    if (!workflowId) return null

    const { data, error } = await this.supabase
      .from('intent_workflows')
      .select('icp_analysis')
      .eq('id', workflowId)
      .single()

    if (error || !data) {
      console.warn(
        `[KeywordSubtopicGenerator] ICP fetch failed for workflow ${workflowId}: ${error?.message}` 
      )
      return null
    }

    return (data as WorkflowRow).icp_analysis ?? null
  }

  private async fetchGeoSettings(organizationId: string): Promise<OrganizationGeo> {
    const { locationCode, languageCode } = await getOrganizationGeoOrThrow(
      this.supabase,
      organizationId
    )
    return { locationCode, languageCode }
  }

  /**
   * Validates that the keyword is in the correct state for subtopic generation.
   * Mirrors the original logic exactly so Step 8 error handling is unchanged.
   */
  private validateKeywordForGeneration(keyword: KeywordRow): void {
    if (keyword.subtopics_status === 'completed') {
      throw new Error('Subtopics already generated')
    }
    if (keyword.longtail_status !== 'completed') {
      throw new Error('Keyword must have longtail_status = completed')
    }
  }

  /**
   * WORM-compliant audit log entry. Non-fatal — a failed log write never
   * rolls back the main operation.
   */
  private async writeAuditLog(
    organizationId: string,
    keywordId: string,
    subtopicCount: number
  ): Promise<void> {
    const { error } = await this.supabase.from('intent_audit_logs').insert({
      organization_id: organizationId,
      action: 'subtopics_generated',
      entity_type: 'keyword',
      entity_id: keywordId,
      details: { subtopic_count: subtopicCount, generator: 'openrouter' },
    })

    if (error) {
      console.warn(
        `[KeywordSubtopicGenerator] Audit log failed for keyword ${keywordId}: ${error.message}` 
      )
    }
  }

  // ─── Utility ───────────────────────────────────────────────────────────────

  private rejectAfter<T>(ms: number, message: string): Promise<T> {
    return new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms))
  }
}
