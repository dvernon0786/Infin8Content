/**
 * lib/services/google/search-console-client.ts
 *
 * Real Google Search Console API client.
 * Replaces the mock in lib/seo/google-search-console.ts.
 *
 * API Reference:
 *   https://developers.google.com/webmaster-tools/v1/api_reference_index
 */

import { getValidTokens, touchLastSynced } from './credential-manager'

export interface GSCQueryRow {
  query: string
  clicks: number
  impressions: number
  ctr: number          // 0-1 float
  position: number
}

export interface GSCPageRow {
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GSCDateRow {
  date: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GSCOverview {
  total_clicks: number
  total_impressions: number
  avg_ctr: number
  avg_position: number
  date_range: { start: string; end: string }
  daily: GSCDateRow[]
  top_queries: GSCQueryRow[]
  top_pages: GSCPageRow[]
}

export interface GSCSite {
  site_url: string
  permission_level: string   // "siteOwner" | "siteFullUser" | "siteRestrictedUser" | "siteUnverifiedUser"
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * List verified sites the authenticated user has access to.
 * Used during setup to let user pick a property.
 */
export async function listVerifiedSites(accessToken: string): Promise<GSCSite[]> {
  const res = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Failed to list GSC sites: ${err.error?.message || res.statusText}`)
  }

  const data = await res.json()
  return (data.siteEntry || []).map((s: any) => ({
    site_url:         s.siteUrl,
    permission_level: s.permissionLevel,
  }))
}

/**
 * Fetch a full search performance overview for a site.
 */
export async function fetchSearchConsoleOverview(
  orgId: string,
  siteUrl: string,
  startDate?: string,
  endDate?: string
): Promise<GSCOverview> {
  const tokens = await getValidTokens(orgId, 'search_console')
  if (!tokens) throw new Error('Google Search Console not connected')

  const end   = endDate   || formatDate(new Date())
  const start = startDate || formatDate(daysAgo(28))

  const [dailyData, queriesData, pagesData] = await Promise.all([
    querySearchAnalytics(tokens.access_token, siteUrl, {
      startDate: start,
      endDate:   end,
      dimensions: ['date'],
      rowLimit:   90,
    }),
    querySearchAnalytics(tokens.access_token, siteUrl, {
      startDate: start,
      endDate:   end,
      dimensions: ['query'],
      rowLimit:   25,
    }),
    querySearchAnalytics(tokens.access_token, siteUrl, {
      startDate: start,
      endDate:   end,
      dimensions: ['page'],
      rowLimit:   25,
    }),
  ])

  await touchLastSynced(orgId, 'search_console')

  const daily = parseDateRows(dailyData)

  return {
    total_clicks:      daily.reduce((s, r) => s + r.clicks, 0),
    total_impressions: daily.reduce((s, r) => s + r.impressions, 0),
    avg_ctr:           average(daily.map(r => r.ctr)),
    avg_position:      average(daily.map(r => r.position)),
    date_range:        { start, end },
    daily,
    top_queries: parseQueryRows(queriesData),
    top_pages:   parsePageRows(pagesData),
  }
}

/**
 * Fetch keyword-specific performance from GSC.
 * Used by the SEO scoring service.
 */
export async function fetchKeywordPerformance(
  orgId: string,
  siteUrl: string,
  keywords: string[]
): Promise<Record<string, GSCQueryRow>> {
  const tokens = await getValidTokens(orgId, 'search_console')
  if (!tokens) throw new Error('Google Search Console not connected')

  const end   = formatDate(new Date())
  const start = formatDate(daysAgo(90))

  const data = await querySearchAnalytics(tokens.access_token, siteUrl, {
    startDate:  start,
    endDate:    end,
    dimensions: ['query'],
    rowLimit:   250,
    dimensionFilterGroups: [{
      filters: keywords.map(kw => ({
        dimension:  'query',
        operator:   'contains',
        expression: kw,
      })),
    }],
  })

  const result: Record<string, GSCQueryRow> = {}
  for (const row of parseQueryRows(data)) {
    result[row.query] = row
  }
  return result
}

// ─── Internal ────────────────────────────────────────────────────────────────

async function querySearchAnalytics(
  accessToken: string,
  siteUrl: string,
  body: Record<string, unknown>
): Promise<any> {
  const encodedSite = encodeURIComponent(siteUrl)
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`,
    {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`GSC query failed: ${err.error?.message || res.statusText}`)
  }

  return res.json()
}

function parseDateRows(data: any): GSCDateRow[] {
  if (!data.rows) return []
  return data.rows.map((row: any) => ({
    date:        row.keys[0] || '',
    clicks:      row.clicks      || 0,
    impressions: row.impressions || 0,
    ctr:         row.ctr         || 0,
    position:    row.position    || 0,
  }))
}

function parseQueryRows(data: any): GSCQueryRow[] {
  if (!data.rows) return []
  return data.rows.map((row: any) => ({
    query:       row.keys[0] || '',
    clicks:      row.clicks      || 0,
    impressions: row.impressions || 0,
    ctr:         row.ctr         || 0,
    position:    row.position    || 0,
  }))
}

function parsePageRows(data: any): GSCPageRow[] {
  if (!data.rows) return []
  return data.rows.map((row: any) => ({
    page:        row.keys[0] || '',
    clicks:      row.clicks      || 0,
    impressions: row.impressions || 0,
    ctr:         row.ctr         || 0,
    position:    row.position    || 0,
  }))
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function average(nums: number[]): number {
  if (!nums.length) return 0
  return nums.reduce((s, n) => s + n, 0) / nums.length
}
