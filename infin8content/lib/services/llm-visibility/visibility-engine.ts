/**
 * lib/services/llm-visibility/visibility-engine.ts
 *
 * Core detection logic:
 *   - Run a prompt against a model via OpenRouter
 *   - Detect brand mentions + position
 *   - Classify sentiment
 *   - Extract cited URLs
 *   - Detect competitor mentions
 *   - Aggregate daily snapshot
 */

import {
  generateContent,
  type OpenRouterMessage,
} from '@/lib/services/openrouter/openrouter-client'

// ── Types ────────────────────────────────────────────────────────────────────

export type MentionPosition = 'list' | 'paragraph' | 'recommendation' | 'table' | 'not_found'
export type Sentiment = 'positive' | 'neutral' | 'negative'

export interface RunResult {
  model: string
  rawResponse: string
  mentioned: boolean
  position: MentionPosition
  sentiment: Sentiment | null
  citedUrls: string[]
  competitorMentions: Record<string, boolean>
}

export interface ProjectConfig {
  brandName: string
  brandAliases: string[]
  competitors: Array<{ name: string; domain: string }>
}

// ── URL extraction ────────────────────────────────────────────────────────────

export function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s\)\]\>\"\']+/g
  return [...new Set(text.match(urlRegex) ?? [])]
}

// ── Brand mention detection ───────────────────────────────────────────────────

export function detectMention(
  response: string,
  brandName: string,
  aliases: string[],
): { mentioned: boolean; position: MentionPosition } {
  const allNames = [brandName, ...aliases]
  const lower = response.toLowerCase()

  const mentioned = allNames.some(name => lower.includes(name.toLowerCase()))
  if (!mentioned) return { mentioned: false, position: 'not_found' }

  // Heuristic position detection
  const listPatterns = /^[\s]*[-•\*\d\.]\s+.*(brand)/im
  const tablePatterns = /\|.*brand.*\|/i
  const recommendPatterns = /\b(recommend|suggest|best|top pick|go with|try)\b/i

  // Replace "brand" with actual name for pattern matching
  const responseForPattern = response.replace(
    new RegExp(allNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'gi'),
    'brand',
  )

  if (tablePatterns.test(responseForPattern)) return { mentioned: true, position: 'table' }
  if (recommendPatterns.test(responseForPattern)) return { mentioned: true, position: 'recommendation' }
  if (listPatterns.test(responseForPattern)) return { mentioned: true, position: 'list' }
  return { mentioned: true, position: 'paragraph' }
}

// ── Competitor mention detection ──────────────────────────────────────────────

export function detectCompetitors(
  response: string,
  competitors: Array<{ name: string }>,
): Record<string, boolean> {
  const lower = response.toLowerCase()
  const result: Record<string, boolean> = {}
  for (const comp of competitors) {
    result[comp.name] = lower.includes(comp.name.toLowerCase())
  }
  return result
}

// ── Sentiment classification ──────────────────────────────────────────────────

export async function classifySentiment(
  response: string,
  brandName: string,
): Promise<Sentiment> {
  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content:
        'You are a brand sentiment classifier. Reply with exactly one word: positive, neutral, or negative. Nothing else.',
    },
    {
      role: 'user',
      content: `AI response text:\n"""\n${response.slice(0, 1500)}\n"""\n\nHow is "${brandName}" portrayed in this response? Reply: positive, neutral, or negative.`,
    },
  ]

  try {
    const result = await generateContent(messages, {
      maxTokens: 5,
      temperature: 0,
      model: 'openai/gpt-4o-mini',
    })
    const word = result.content.trim().toLowerCase()
    if (word === 'positive' || word === 'negative') return word
    return 'neutral'
  } catch {
    return 'neutral'
  }
}

// ── Run a single prompt against one model ────────────────────────────────────

export async function runPromptAgainstModel(
  promptText: string,
  model: string,
  project: ProjectConfig,
): Promise<RunResult> {
  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content:
        'You are a helpful AI assistant. Answer the user question naturally and helpfully. Do not mention that you are being tested or monitored.',
    },
    {
      role: 'user',
      content: promptText,
    },
  ]

  let rawResponse = ''
  try {
    const result = await generateContent(messages, {
      maxTokens: 800,
      temperature: 0.7,
      model,
      disableFallback: true, // use the exact model requested
    })
    rawResponse = result.content
  } catch (err) {
    // Model unavailable — return a not-found result rather than crashing
    return {
      model,
      rawResponse: '',
      mentioned: false,
      position: 'not_found',
      sentiment: null,
      citedUrls: [],
      competitorMentions: detectCompetitors('', project.competitors),
    }
  }

  const { mentioned, position } = detectMention(
    rawResponse,
    project.brandName,
    project.brandAliases,
  )

  const sentiment = mentioned
    ? await classifySentiment(rawResponse, project.brandName)
    : null

  const citedUrls = extractUrls(rawResponse)
  const competitorMentions = detectCompetitors(rawResponse, project.competitors)

  return { model, rawResponse, mentioned, position, sentiment, citedUrls, competitorMentions }
}

// ── Aggregate snapshot from runs ──────────────────────────────────────────────

export interface SnapshotInput {
  runs: Array<{
    mentioned: boolean
    sentiment: Sentiment | null
    model: string
    category: string // prompt category
  }>
}

export function aggregateSnapshot(input: SnapshotInput) {
  const { runs } = input
  const total = runs.length
  if (total === 0) return null

  const mentions = runs.filter(r => r.mentioned)
  const visibilityScore = Number(((mentions.length / total) * 100).toFixed(2))

  const sentimentPos = mentions.filter(r => r.sentiment === 'positive').length
  const sentimentNeu = mentions.filter(r => r.sentiment === 'neutral').length
  const sentimentNeg = mentions.filter(r => r.sentiment === 'negative').length

  // KPI AI Search = % of commercial prompts with mention
  const commercialRuns = runs.filter(r => r.category === 'commercial')
  const kpiAiSearch = commercialRuns.length > 0
    ? Number(((commercialRuns.filter(r => r.mentioned).length / commercialRuns.length) * 100).toFixed(2))
    : 0

  // Per-model stats
  const models = [...new Set(runs.map(r => r.model))]
  const perModelStats: Record<string, { visibility: number; mentions: number }> = {}
  for (const model of models) {
    const modelRuns = runs.filter(r => r.model === model)
    const modelMentions = modelRuns.filter(r => r.mentioned).length
    const shortName = model.split('/').pop() ?? model
    perModelStats[shortName] = {
      visibility: Number(((modelMentions / modelRuns.length) * 100).toFixed(2)),
      mentions: modelMentions,
    }
  }

  const frequencyLabel =
    visibilityScore >= 70 ? 'FREQUENT' :
    visibilityScore >= 35 ? 'MODERATE' : 'RARE'

  return {
    visibilityScore,
    totalMentions: mentions.length,
    totalRuns: total,
    sentimentPositive: sentimentPos,
    sentimentNeutral: sentimentNeu,
    sentimentNegative: sentimentNeg,
    kpiAiSearch,
    frequencyLabel,
    perModelStats,
    totalVolume: total * 12000, // proxy: runs × avg search volume weight
  }
}
