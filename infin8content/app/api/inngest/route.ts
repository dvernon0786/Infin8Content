import { serve } from 'inngest/next'
import { generateArticle } from '@/lib/inngest/functions/generate-article'
import { cleanupStuckArticles } from '@/lib/inngest/functions/cleanup-stuck-articles'
import { inngest } from '@/lib/inngest/client'
import { NextRequest, NextResponse } from 'next/server'

// Validate environment variables at runtime (not build time)
const eventKey = process.env.INNGEST_EVENT_KEY
const signingKey = process.env.INNGEST_SIGNING_KEY

// Create handlers only if env vars are set
const handlers = eventKey
  ? serve({
      client: inngest,
      signingKey,
      functions: [generateArticle, cleanupStuckArticles],
    })
  : {
      GET: async () => {
        console.error('[Inngest API] ERROR: INNGEST_EVENT_KEY environment variable is not set')
        return NextResponse.json(
          { error: 'INNGEST_EVENT_KEY environment variable is not set' },
          { status: 500 }
        )
      },
      POST: async () => {
        console.error('[Inngest API] ERROR: INNGEST_EVENT_KEY environment variable is not set')
        return NextResponse.json(
          { error: 'INNGEST_EVENT_KEY environment variable is not set' },
          { status: 500 }
        )
      },
      PUT: async () => {
        console.error('[Inngest API] ERROR: INNGEST_EVENT_KEY environment variable is not set')
        return NextResponse.json(
          { error: 'INNGEST_EVENT_KEY environment variable is not set' },
          { status: 500 }
        )
      },
    }

// Wrap handlers with error logging
const wrapHandler = (handler: (req: NextRequest) => Promise<Response>) => {
  return async (req: NextRequest) => {
    try {
      console.log(`[Inngest API] ${req.method} request to ${req.nextUrl.pathname}`)
      const response = await handler(req)
      console.log(`[Inngest API] ${req.method} response: ${response.status}`)
      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`[Inngest API] ERROR in ${req.method} handler:`, {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        path: req.nextUrl.pathname
      })
      return NextResponse.json(
        { error: 'Internal server error', details: errorMessage },
        { status: 500 }
      )
    }
  }
}

export const GET = wrapHandler(handlers.GET)
export const POST = wrapHandler(handlers.POST)
export const PUT = wrapHandler(handlers.PUT)

