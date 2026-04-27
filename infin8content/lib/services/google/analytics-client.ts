/**
 * lib/services/google/analytics-client.ts
 *
 * Google Analytics 4 Data API client.
 * Replaces the in-memory event-emitter stub with real GA4 API calls.
 *
 * API Reference:
 *   https://developers.google.com/analytics/devguides/reporting/data/v1
 */

import { getValidTokens } from './credential-manager'

export interface GAMetricRow {
  date: string
  sessions: number
  pageviews: number
  users: number
  bounce_rate: number
  avg_session_duration: number
  new_users: number
}

export interface GATopPage {
  page_path: string
  page_title: string
  pageviews: number
  unique_pageviews: number
  avg_time_on_page: number
}

export interface GATopSource {
  source: string
  medium: string
  sessions: number
  conversions: number
}

export interface GAOverview {
  total_sessions: number
  total_users: number
  total_pageviews: number
  avg_bounce_rate: number
  avg_session_duration: number   // seconds
  date_range: { start: string; end: string }
  daily: GAMetricRow[]
  top_pages: GATopPage[]
  top_sources: GATopSource[]
}

export interface GAPropertyInfo {
  property_id: string
  display_name: string
  create_time: string
  time_zone: string
  currency_code: string
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * List all GA4 properties accessible to the authenticated account.
 * Used during setup to let the user pick a property.
 */
export async function listGA4Properties(accessToken: string): Promise<GAPropertyInfo[]> {
  const res = await fetch(
    'https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:accounts/-',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Failed to list GA4 properties: ${err.error?.message || res.statusText}`)
  }

  const data = await res.json()
  return (data.properties || []).map((p: any) => ({
    property_id:  p.name,          // "properties/123456789"
    display_name: p.displayName,
    create_time:  p.createTime,
    time_zone:    p.timeZone,
    currency_code: p.currencyCode,
  }))
}

/**
 * Fetch a full analytics overview for the given date range.
 */
export async function fetchAnalyticsOverview(
  orgId: string,
  propertyId: string,
  startDate = '30daysAgo',
  endDate = 'today'
): Promise<GAOverview> {
  const tokens = await getValidTokens(orgId, 'analytics')
  if (!tokens) throw new Error('Google Analytics not connected')

  const [dailyData, topPagesData, topSourcesData] = await Promise.all([
    runReport(tokens.access_token, propertyId, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        { name: 'newUsers' },
      ],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    }),
    runReport(tokens.access_token, propertyId, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'sessions' },
        { name: 'averageSessionDuration' },
      ],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    }),
    runReport(tokens.access_token, propertyId, {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
      metrics: [{ name: 'sessions' }, { name: 'conversions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10,
    }),
  ])

  const daily = parseDailyRows(dailyData)
  const totals = computeTotals(daily)

  return {
    ...totals,
    date_range: { start: startDate, end: endDate },
    daily,
    top_pages:   parseTopPages(topPagesData),
    top_sources: parseTopSources(topSourcesData),
  }
}

// ─── Internal ────────────────────────────────────────────────────────────────

async function runReport(
  accessToken: string,
  propertyId: string,
  body: Record<string, unknown>
): Promise<any> {
  // Normalise: accept "properties/123" or just "123"
  const pid = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/${pid}:runReport`,
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
    throw new Error(`GA4 report failed: ${err.error?.message || res.statusText}`)
  }

  return res.json()
}

function parseDailyRows(data: any): GAMetricRow[] {
  if (!data.rows) return []
  return data.rows.map((row: any) => {
    const d  = row.dimensionValues
    const m  = row.metricValues
    const rawDate = d[0]?.value || ''
    // GA4 returns dates as YYYYMMDD
    const date = rawDate.length === 8
      ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
      : rawDate

    return {
      date,
      sessions:              Number(m[0]?.value || 0),
      users:                 Number(m[1]?.value || 0),
      pageviews:             Number(m[2]?.value || 0),
      bounce_rate:           parseFloat(m[3]?.value || '0'),
      avg_session_duration:  parseFloat(m[4]?.value || '0'),
      new_users:             Number(m[5]?.value || 0),
    }
  })
}

function computeTotals(daily: GAMetricRow[]) {
  if (!daily.length) {
    return {
      total_sessions: 0,
      total_users: 0,
      total_pageviews: 0,
      avg_bounce_rate: 0,
      avg_session_duration: 0,
    }
  }
  const total_sessions    = daily.reduce((s, r) => s + r.sessions, 0)
  const total_users       = daily.reduce((s, r) => s + r.users, 0)
  const total_pageviews   = daily.reduce((s, r) => s + r.pageviews, 0)
  const avg_bounce_rate   = daily.reduce((s, r) => s + r.bounce_rate, 0) / daily.length
  const avg_session_duration = daily.reduce((s, r) => s + r.avg_session_duration, 0) / daily.length

  return { total_sessions, total_users, total_pageviews, avg_bounce_rate, avg_session_duration }
}

function parseTopPages(data: any): GATopPage[] {
  if (!data.rows) return []
  return data.rows.map((row: any) => ({
    page_path:        row.dimensionValues[0]?.value || '',
    page_title:       row.dimensionValues[1]?.value || '',
    pageviews:        Number(row.metricValues[0]?.value || 0),
    unique_pageviews: Number(row.metricValues[1]?.value || 0),
    avg_time_on_page: parseFloat(row.metricValues[2]?.value || '0'),
  }))
}

function parseTopSources(data: any): GATopSource[] {
  if (!data.rows) return []
  return data.rows.map((row: any) => ({
    source:      row.dimensionValues[0]?.value || '',
    medium:      row.dimensionValues[1]?.value || '',
    sessions:    Number(row.metricValues[0]?.value || 0),
    conversions: Number(row.metricValues[1]?.value || 0),
  }))
}
