// DataForSEO + OpenRouter Enterprise Subtopic Engine
// Compile-clean | Step 9 compatible | Workflow-safe

import { generateContent } from '@/lib/services/openrouter/openrouter-client'

export interface KeywordSubtopic {
  title: string
  keywords: string[]
}

interface AISubtopic {
  title: string
  keywords?: string[]
}

export class DataForSEOSubtopicClient {
  private login: string
  private password: string
  private baseUrl = 'https://api.dataforseo.com'
  private maxRetries = 3
  private retryDelays = [2000, 4000, 8000]

  constructor(login: string, password: string) {
    this.login = login
    this.password = password
  }

  // ==========================================================
  // MAIN ENTRY
  // ==========================================================

  async generateSubtopics(
    topic: string,
    language: string,
    locationCode: number,
    limit: number = 3
  ): Promise<KeywordSubtopic[]> {

    if (!topic?.trim()) throw new Error('Topic is required')
    if (!language?.trim()) throw new Error('Language is required')
    if (!locationCode) throw new Error('Location code is required')

    const authHeader =
      'Basic ' + Buffer.from(`${this.login}:${this.password}`).toString('base64')

    try {
      const intelligence = await this.fetchCompetitiveIntelligence(
        topic,
        language,
        locationCode,
        authHeader
      )

      const aiStructured = await this.generateWithAI(
        topic,
        language,
        intelligence
      )

      const formatted: KeywordSubtopic[] = aiStructured.map(st => ({
        title: st.title,
        keywords: st.keywords?.length ? st.keywords : [topic]
      }))

      return this.enforceExactlyThree(formatted, topic)

    } catch (error) {
      console.warn('[Step 8] Intelligence failed. Using fallback.', error)
      return this.fallbackSubtopics(topic, language)
    }
  }

  // ==========================================================
  // COMPETITIVE INTELLIGENCE
  // ==========================================================

  private async fetchCompetitiveIntelligence(
    topic: string,
    language: string,
    location: number,
    auth: string
  ) {

    const results = await Promise.allSettled([
      this.fetchSERP(topic, language, location, auth),
      this.fetchRelated(topic, language, location, auth),
      this.fetchQuestions(topic, language, location, auth)
    ])

    return {
      serp: results[0].status === 'fulfilled' ? results[0].value : [],
      related: results[1].status === 'fulfilled' ? results[1].value : [],
      questions: results[2].status === 'fulfilled' ? results[2].value : []
    }
  }

  // ==========================================================
  // AI SYNTHESIS (OpenRouter Only)
  // ==========================================================

  private async generateWithAI(
    keyword: string,
    language: string,
    intelligence: any
  ): Promise<AISubtopic[]> {

    const prompt = this.buildPrompt(keyword, language, intelligence)

    const result = await Promise.race([
      generateContent(
        [
          {
            role: 'system',
            content: 'You are a strategic B2B content architect. Always return valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        {
          maxTokens: 900,
          temperature: 0.2
        }
      ),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI timeout')), 15000)
      )
    ])

    return this.parseAndValidate(result.content, keyword, language)
  }

  private buildPrompt(keyword: string, language: string, data: any): string {
    return `
Generate EXACTLY 3 strategic B2B article subtopics in "${language}" for "${keyword}".

Top SERP Titles:
${data.serp.slice(0, 3).map((r: any) => `- ${r.title}`).join('\n')}

Related Searches:
${data.related.slice(0, 5).map((r: any) => `- ${r.keyword}`).join('\n')}

User Questions:
${data.questions.slice(0, 5).map((q: any) => `- ${q.question}`).join('\n')}

Return ONLY valid JSON:

{
  "subtopics": [
    { "title": "...", "keywords": [] },
    { "title": "...", "keywords": [] },
    { "title": "...", "keywords": [] }
  ]
}
`
  }

  private parseAndValidate(
    response: string,
    keyword: string,
    language: string
  ): AISubtopic[] {

    try {
      const cleaned = response
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()

      const parsed = JSON.parse(cleaned)

      if (!Array.isArray(parsed.subtopics)) {
        throw new Error('Invalid AI structure')
      }

      return parsed.subtopics.slice(0, 3)

    } catch {
      return this.fallbackSubtopics(keyword, language)
    }
  }

  // ==========================================================
  // DATAFORSEO FETCH METHODS (RETRY SAFE)
  // ==========================================================

  private async fetchSERP(topic: string, language: string, location: number, auth: string) {
    return this.retry(async () => {
      const res = await fetch(`${this.baseUrl}/v3/serp/google/organic/live/advanced`, {
        method: 'POST',
        headers: { Authorization: auth, 'Content-Type': 'application/json' },
        body: JSON.stringify([{
          keyword: topic,
          language_code: language,
          location_code: location,
          depth: 10
        }])
      })

      if (!res.ok) throw new Error('SERP fetch failed')
      const data = await res.json()
      return data?.tasks?.[0]?.result?.[0]?.items || []
    })
  }

  private async fetchRelated(topic: string, language: string, location: number, auth: string) {
    return this.retry(async () => {
      const res = await fetch(`${this.baseUrl}/v3/dataforseo_labs/google/related_searches/live`, {
        method: 'POST',
        headers: { Authorization: auth, 'Content-Type': 'application/json' },
        body: JSON.stringify([{ keyword: topic, language_code: language, location_code: location }])
      })

      if (!res.ok) throw new Error('Related fetch failed')
      const data = await res.json()
      return data?.tasks?.[0]?.result || []
    })
  }

  private async fetchQuestions(topic: string, language: string, location: number, auth: string) {
    return this.retry(async () => {
      const res = await fetch(`${this.baseUrl}/v3/dataforseo_labs/google/keyword_questions/live`, {
        method: 'POST',
        headers: { Authorization: auth, 'Content-Type': 'application/json' },
        body: JSON.stringify([{ keyword: topic, language_code: language, location_code: location }])
      })

      if (!res.ok) throw new Error('Questions fetch failed')
      const data = await res.json()
      return data?.tasks?.[0]?.result || []
    })
  }

  // ==========================================================
  // SAFETY ENFORCEMENT
  // ==========================================================

  private enforceExactlyThree(
    subtopics: KeywordSubtopic[],
    keyword: string
  ): KeywordSubtopic[] {

    while (subtopics.length < 3) {
      subtopics.push({
        title: `Additional insights on ${keyword}`,
        keywords: [keyword]
      })
    }

    return subtopics.slice(0, 3)
  }

  private fallbackSubtopics(
    keyword: string,
    language: string
  ): KeywordSubtopic[] {

    const templates: Record<string, { what: string; benefits: string; how: string }> = {
      en: {
        what: `What is ${keyword}?`,
        benefits: `${keyword} benefits`,
        how: `How to implement ${keyword}` 
      },
      de: {
        what: `Was ist ${keyword}?`,
        benefits: `${keyword} Vorteile`,
        how: `Wie man ${keyword} implementiert` 
      },
      fr: {
        what: `Qu'est-ce que ${keyword}?`,
        benefits: `Avantages de ${keyword}`,
        how: `Comment implémenter ${keyword}` 
      }
    }

    const t = templates[language] || templates.en

    return [
      { title: t.what, keywords: [keyword] },
      { title: t.benefits, keywords: [keyword] },
      { title: t.how, keywords: [keyword] }
    ]
  }

  private async retry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null

    for (let i = 0; i < this.maxRetries; i++) {
      try {
        return await fn()
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        if (i < this.maxRetries - 1) {
          await new Promise(r => setTimeout(r, this.retryDelays[i]))
        }
      }
    }

    throw lastError || new Error('Retry failed')
  }
}

// ==========================================================
// SINGLETON + EXPORT WRAPPER
// ==========================================================

let instance: DataForSEOSubtopicClient | null = null

export function getDataForSEOSubtopicClient(): DataForSEOSubtopicClient {
  if (!instance) {
    if (!process.env.DATAFORSEO_LOGIN) throw new Error('DATAFORSEO_LOGIN missing')
    if (!process.env.DATAFORSEO_PASSWORD) throw new Error('DATAFORSEO_PASSWORD missing')
    instance = new DataForSEOSubtopicClient(
      process.env.DATAFORSEO_LOGIN,
      process.env.DATAFORSEO_PASSWORD
    )
  }
  return instance
}

export async function generateSubtopics(
  topic: string,
  language: string,
  locationCode: number,
  limit: number = 3
): Promise<KeywordSubtopic[]> {
  const client = getDataForSEOSubtopicClient()
  return client.generateSubtopics(topic, language, locationCode, limit)
}
