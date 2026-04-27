/**
 * News Poller + Story Generator — Story 13-1
 *
 * Simplified pipeline (no FSM, no intent_workflows, no keyword clustering):
 *   Cron → Fetch stories → Deduplicate → AI summary (single OpenRouter call)
 *        → Save to articles table → Optionally push to CMS
 *
 * Three exported Inngest functions:
 *   newsPollScheduled  - cron every 15 min, finds due watches, fans out events
 *   newsPollWatch      - per-watch: fetch, dedup, enqueue stories, update last_polled_at
 *   newsGenerateStory  - per-story: idempotency, AI summary, save, dedup record, optional CMS
 */

import { inngest } from '@/lib/inngest/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { generateContent } from '@/lib/services/openrouter/openrouter-client'
import { publishArticle } from '@/lib/services/publishing/cms-publisher'
import { searchHNStories } from '@/lib/services/hackernews/hackernews-client'
import { searchGoogleNews } from '@/lib/services/googlenews/googlenews-client'
import { randomUUID } from 'crypto'
import type { NewsArticleConfig } from '@/types/article'

// ── Internal types ────────────────────────────────────────────────────────────

type NewsSource = 'hackernews' | 'google_news'

interface NewsWatchConfig extends NewsArticleConfig {
  source?:               NewsSource
  poll_interval_minutes?: 15 | 30 | 60
  auto_publish?:         boolean
  min_hn_score?:         number
  resolve_gn_links?:     boolean
  cms_connection_id?:    string
}

interface FetchedStory {
  id:             string
  title:          string
  url:            string
  excerpt:        string
  published_date: string | null
  author:         string | null
  score:          number
}

// ── Master cron — runs every 15 min, handles all intervals ───────────────────

export const newsPollScheduled = inngest.createFunction(
  { id: 'news/poll.scheduled' },
  { cron: '*/15 * * * *' },
  async ({ step }) => {
    const supabase = createServiceRoleClient()
    const now      = Date.now()

    const watches = await step.run('find-due-watches', async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('id, org_id, article_type_config')
        .eq('article_type', 'news')
        .not('article_type_config->poll_interval_minutes', 'is', null)

      if (error) throw new Error(`DB error fetching watches: ${error.message}`)
      if (!data?.length) return []

      // Filter client-side: each watch has its own interval (15/30/60 min)
      return (data as any[]).filter((row) => {
        const cfg: NewsWatchConfig = row.article_type_config ?? {}
        const intervalMs = (cfg.poll_interval_minutes ?? 15) * 60 * 1000
        const lastPolled = cfg.last_polled_at
          ? new Date(cfg.last_polled_at).getTime()
          : 0
        return now - lastPolled >= intervalMs
      })
    })

    if (!watches.length) return { processed: 0 }

    // Fix #2: step.sendEvent() (Inngest v3 fan-out, not inngest.send())
    await step.sendEvent(
      'enqueue-watches',
      (watches as any[]).map((w) => ({
        name: 'news/poll.watch' as const,
        data: { watchId: w.id, orgId: w.org_id },
      }))
    )

    return { processed: watches.length }
  }
)

// ── Per-watch poller ──────────────────────────────────────────────────────────

export const newsPollWatch = inngest.createFunction(
  {
    id:          'news/poll.watch',
    concurrency: { limit: 3, key: 'event.data.orgId' },
  },
  { event: 'news/poll.watch' },
  async ({ event, step }) => {
    const { watchId, orgId } = event.data as { watchId: string; orgId: string }
    const supabase = createServiceRoleClient()

    const watch = await step.run('load-watch', async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('id, org_id, article_type_config')
        .eq('id', watchId)
        .eq('article_type', 'news')
        .single()
      if (error || !data) throw new Error(`Watch ${watchId} not found`)
      return data as any
    })

    const cfg:     NewsWatchConfig = watch.article_type_config ?? {}
    const source:  NewsSource      = cfg.source ?? 'hackernews'
    const topic                    = cfg.topic ?? ''
    const daysBack =
      cfg.time_range === '24h' ? 1 :
      cfg.time_range === '30d' ? 30 : 7

    const stories = await step.run('fetch-stories', async () => {
      if (source === 'hackernews') {
        return searchHNStories(topic, { daysBack, maxResults: 20 })
      }
      return searchGoogleNews(topic, {
        daysBack,
        maxResults:   20,
        resolveLinks: cfg.resolve_gn_links ?? false,
      })
    })

    if (!stories.length) {
      await step.run('update-last-polled', () => _updateLastPolled(supabase, watchId))
      return { found: 0, new: 0 }
    }

    const minScore = cfg.min_hn_score ?? 0
    const filtered = stories.filter((s) =>
      source === 'hackernews' ? s.score >= minScore : true
    )

    const newStories = await step.run('deduplicate', async () => {
      const sourceIds = filtered.map((s) => s.id)
      const { data: seen } = await supabase
        .from('news_processed_stories')
        .select('source_id')
        .eq('org_id', orgId)
        .eq('source', source)
        .in('source_id', sourceIds)

      const seenSet = new Set(((seen ?? []) as any[]).map((r) => r.source_id))
      return filtered.filter((s) => !seenSet.has(s.id))
    })

    if (!newStories.length) {
      await step.run('update-last-polled', () => _updateLastPolled(supabase, watchId))
      return { found: stories.length, new: 0 }
    }

    const toProcess = newStories.slice(0, 5) // cost guard: max 5 stories per run

    // Fix #2: step.sendEvent() fan-out for Inngest v3
    await step.sendEvent(
      'enqueue-stories',
      toProcess.map((story) => ({
        name: 'news/generate.story' as const,
        data: { orgId, watchId, source, story, watchConfig: cfg },
      }))
    )

    await step.run('update-last-polled', () => _updateLastPolled(supabase, watchId))

    return { found: stories.length, new: toProcess.length }
  }
)

// ── Per-story generator ───────────────────────────────────────────────────────

export const newsGenerateStory = inngest.createFunction(
  {
    id:          'news/generate.story',
    concurrency: { limit: 5, key: 'event.data.orgId' },
  },
  { event: 'news/generate.story' },
  async ({ event, step }) => {
    const { orgId, watchId, source, story, watchConfig } = event.data as {
      orgId:       string
      watchId:     string
      source:      NewsSource
      story:       FetchedStory
      watchConfig: NewsWatchConfig
    }
    const supabase = createServiceRoleClient()

    // Idempotency guard — safe for Inngest retries
    const alreadyDone = await step.run('check-idempotency', async () => {
      const { data } = await supabase
        .from('news_processed_stories')
        .select('id')
        .eq('org_id', orgId)
        .eq('source', source)
        .eq('source_id', story.id)
        .maybeSingle()
      return !!data
    })
    if (alreadyDone) return { skipped: true, reason: 'already processed' }

    // Single OpenRouter call — no full pipeline, no section loop
    const { summary, articleTitle } = await step.run('ai-summary', async () => {
      const lang  = watchConfig.language ?? 'en'
      const focus = watchConfig.article_focus ?? 'analysis'

      const focusLabel =
        focus === 'breaking_news' ? 'a breaking news piece' :
        focus === 'roundup'       ? 'a news roundup entry'  :
                                    'an in-depth news analysis'

      const systemPrompt =
        `You are a news writer writing ${focusLabel}.\n` +
        `Write in ${lang}. Be concise (200–400 words). Always include attribution to the original source.\n` +
        `Do NOT fabricate facts. Only expand on what is provided in the story excerpt.\n` +
        `Return valid JSON only: { "title": "...", "body": "..." }`

      const userPrompt =
        `Original story:\n` +
        `Title: ${story.title}\n` +
        `Source: ${story.author ?? source}\n` +
        `Published: ${story.published_date ?? 'recently'}\n` +
        `URL: ${story.url}\n` +
        `Excerpt: ${story.excerpt}\n\n` +
        `Write a${lang !== 'en' ? ' ' + lang + '-language' : ''} news summary post for this story.\n` +
        `Include a clear attribution line at the end: "Source: [author/publication] — [URL]"`

      const result = await generateContent(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   },
        ],
        { model: 'openai/gpt-4o-mini', temperature: 0.4, maxTokens: 800 }
      )

      let parsed: { title: string; body: string }
      try {
        const jsonMatch = result.content.match(/\{[\s\S]*\}/)
        parsed = JSON.parse(jsonMatch?.[0] ?? '{}')
      } catch {
        parsed = { title: story.title, body: result.content }
      }

      return {
        articleTitle: parsed.title || story.title,
        summary:      parsed.body  || result.content,
      }
    })

    // Persist article — Fix #5: UUID suffix guarantees slug uniqueness
    const articleId = await step.run('save-article', async () => {
      const today = new Date().toISOString()
      const slug =
        articleTitle
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-')
          .slice(0, 100) +
        '-' + randomUUID().slice(0, 8)

      const { data, error } = await supabase
        .from('articles')
        .insert({
          org_id:              orgId,
          article_type:        'news',
          article_type_config: {
            ...watchConfig,
            source_story_id:    story.id,
            source_story_url:   story.url,
            source_story_title: story.title,
          },
          title:                articleTitle,
          slug,
          final_markdown:       _buildMarkdown(story, summary, articleTitle),
          word_count:           summary.split(/\s+/).length,
          reading_time_minutes: Math.ceil(summary.split(/\s+/).length / 200),
          status:               watchConfig.auto_publish ? 'completed' : 'draft',
          cms_status:           watchConfig.auto_publish ? 'published' : 'draft',
          generation_metadata:  {
            source,
            source_id:    story.id,
            source_url:   story.url,
            source_title: story.title,
            watch_id:     watchId,
            generated_at: today,
          },
          created_at: today,
          updated_at: today,
        })
        .select('id')
        .single()

      if (error) throw new Error(`Failed to save news article: ${error.message}`)
      return (data as any).id as string
    })

    // Record in dedup table
    await step.run('mark-processed', async () => {
      await supabase.from('news_processed_stories').insert({
        org_id:               orgId,
        watch_topic:          watchConfig.topic ?? '',
        source,
        source_id:            story.id,
        source_url:           story.url,
        source_title:         story.title,
        generated_article_id: articleId,
      })
    })

    // Optional CMS publish — non-fatal if it fails
    if (watchConfig.auto_publish && watchConfig.cms_connection_id) {
      await step.run('publish-to-cms', async () => {
        try {
          await publishArticle({
            articleId,
            organizationId: orgId,
            connectionId:   watchConfig.cms_connection_id!,
          })
        } catch (err) {
          console.warn(
            `[NewsPoller] CMS publish failed for article ${articleId}:`,
            (err as Error).message
          )
        }
      })
    }

    return { articleId, title: articleTitle, source, sourceUrl: story.url }
  }
)

// ── Helpers ───────────────────────────────────────────────────────────────────

function _buildMarkdown(story: FetchedStory, summary: string, title: string): string {
  const today       = new Date().toISOString().split('T')[0]
  const sourceLabel = story.author ?? 'Original Source'
  return [
    `# ${title}`,
    `*Published: ${today} · Auto-generated news summary*`,
    '',
    summary,
    '',
    '---',
    `*Source: [${sourceLabel}](${story.url}) — Published: ${story.published_date ?? 'recently'}*`,
    `*Editorial note: This is an AI-generated summary. Read the full article at the source link above.*`,
  ].join('\n')
}

// Fix #1: targeted JSONB merge — never overwrites the whole column
async function _updateLastPolled(supabase: any, watchId: string): Promise<void> {
  await supabase.rpc('jsonb_merge_article_type_config', {
    p_article_id: watchId,
    p_patch:      { last_polled_at: new Date().toISOString() },
  })
}
