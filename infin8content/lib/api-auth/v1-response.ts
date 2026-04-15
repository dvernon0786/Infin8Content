/**
 * lib/api-auth/v1-response.ts
 * Epic 11, Story 11.2 + 11.8
 *
 * Standardized JSON envelope for all /api/v1/* responses.
 * Success:  { data: T, status: 'success', timestamp: ISO }
 * Error:    { error: { code, message, actionableSteps? }, status: 'error', timestamp: ISO }
 *
 * Also exports applyRateLimitHeaders() — sets X-RateLimit-* on every response.
 */

import { NextResponse } from 'next/server'
import type { RateLimitResult } from './validate-api-key'

export interface V1ErrorDetail {
  code: string
  message: string
  actionableSteps?: string[]
}

// ─── Response factories ───────────────────────────────────────────────────────

export function v1Ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    { data, status: 'success', timestamp: new Date().toISOString() },
    {
      status,
      headers: {
        'X-API-Version': '1',
        'Content-Type': 'application/json',
      },
    }
  )
}

export function v1Error(
  code: string,
  message: string,
  httpStatus: number,
  actionableSteps?: string[]
): NextResponse {
  const body: { error: V1ErrorDetail; status: 'error'; timestamp: string } = {
    error: { code, message, ...(actionableSteps ? { actionableSteps } : {}) },
    status: 'error',
    timestamp: new Date().toISOString(),
  }
  return NextResponse.json(body, {
    status: httpStatus,
    headers: { 'X-API-Version': '1', 'Content-Type': 'application/json' },
  })
}

// ─── Rate limit headers ───────────────────────────────────────────────────────

/**
 * Clones a NextResponse and injects standard X-RateLimit-* headers.
 * Should be called by with-api-auth.ts after every successful handler execution.
 */
export function applyRateLimitHeaders(
  response: NextResponse,
  rl: RateLimitResult
): NextResponse {
  const headers = new Headers(response.headers)
  if (rl.limit !== null) {
    headers.set('X-RateLimit-Limit', String(rl.limit))
    headers.set('X-RateLimit-Remaining', String(rl.remaining ?? 0))
  } else {
    headers.set('X-RateLimit-Limit', 'unlimited')
    headers.set('X-RateLimit-Remaining', 'unlimited')
  }
  headers.set('X-RateLimit-Reset', String(Math.floor(rl.resetAt.getTime() / 1000)))

  return new NextResponse(response.body, {
    status: response.status,
    headers,
  })
}

// ─── 429 Too Many Requests ────────────────────────────────────────────────────

export function v1RateLimited(rl: RateLimitResult): NextResponse {
  return v1Error(
    'RATE_LIMIT_EXCEEDED',
    `Rate limit exceeded. You have used ${rl.limit} of ${rl.limit} API calls this month.`,
    429,
    [
      'Wait for rate limit reset (next billing period)',
      'Upgrade plan for higher limits',
      'Contact support for a temporary limit increase',
    ]
  )
}
