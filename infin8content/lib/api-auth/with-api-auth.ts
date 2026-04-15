/**
 * lib/api-auth/with-api-auth.ts
 * Epic 11, Stories 11.2 + 11.3 + 11.8
 *
 * Higher-order wrapper for all /api/v1/* route handlers.
 * Handles in order:
 *  1. API key extraction + validation (401 if missing/invalid)
 *  2. Scope check (403 if key lacks required scope)
 *  3. Rate limit check + increment (429 if exceeded)
 *  4. Injects { validated } context into the handler
 *  5. Applies X-RateLimit-* + X-API-Version headers to the response
 *
 * Usage:
 *   export const GET = withApiAuth('articles:read', async ({ validated }) => {
 *     return v1Ok({ articles: [] })
 *   })
 */

import { NextResponse } from 'next/server'
import {
  validateApiKey,
  checkAndIncrementRateLimit,
  hasScope,
  type ValidatedApiKey,
  type ApiScope,
} from './validate-api-key'
import {
  v1Error,
  v1RateLimited,
  applyRateLimitHeaders,
} from './v1-response'

export interface ApiAuthContext {
  validated: ValidatedApiKey
  request: Request
}

type ApiHandler = (ctx: ApiAuthContext) => Promise<NextResponse>

export function withApiAuth(requiredScope: ApiScope, handler: ApiHandler) {
  return async function (request: Request, routeContext?: any): Promise<NextResponse> {
    // 1. Validate key
    const validated = await validateApiKey(request)
    if (!validated) {
      return v1Error(
        'UNAUTHORIZED',
        'Valid API key required. Pass it as: Authorization: Bearer <key>',
        401
      )
    }

    // 2. Scope check
    if (!hasScope(validated, requiredScope)) {
      return v1Error(
        'INSUFFICIENT_SCOPE',
        `This endpoint requires the '${requiredScope}' scope. Regenerate your API key with the correct permissions.`,
        403
      )
    }

    // 3. Rate limit (extract endpoint path for analytics tracking)
    const url = new URL(request.url)
    const rl = await checkAndIncrementRateLimit(validated, url.pathname)

    if (!rl.allowed) {
      return v1RateLimited(rl)
    }

    // 4. Run handler
    let response: NextResponse
    try {
      response = await handler({ validated, request })
    } catch (err: any) {
      console.error('[withApiAuth] handler error:', err)
      return v1Error('INTERNAL_ERROR', 'An unexpected error occurred', 500)
    }

    // 5. Apply rate limit headers
    return applyRateLimitHeaders(response, rl)
  }
}
