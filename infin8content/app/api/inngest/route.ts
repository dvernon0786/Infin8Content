import { serve } from 'inngest/next'
import { generateArticle } from '@/lib/inngest/functions/generate-article'
import { cleanupStuckArticles } from '@/lib/inngest/functions/cleanup-stuck-articles'
import { inngest } from '@/lib/inngest/client'
import { NextRequest, NextResponse } from 'next/server'

// Validate environment variables at runtime (not build time)
const eventKey = process.env.INNGEST_EVENT_KEY
const signingKey = process.env.INNGEST_SIGNING_KEY
const isDevelopment = process.env.NODE_ENV === 'development'

// For local development, Inngest dev server uses auto-discovery and doesn't require signing key
// For production, both eventKey and signingKey are required
const useInngestServe = isDevelopment || (eventKey && signingKey)

// Log function registration
console.log('[Inngest API] Registering functions:', {
  useInngestServe,
  isDevelopment,
  hasEventKey: !!eventKey,
  hasSigningKey: !!signingKey,
  functionIds: ['article/generate', 'articles/cleanup-stuck'],
})

// Create handlers - allow local dev without env vars
const handlers = useInngestServe
  ? serve({
      client: inngest,
      signingKey: signingKey || undefined, // Optional for local dev
      functions: [generateArticle, cleanupStuckArticles],
    })
  : {
      GET: async () => {
        const errorMsg = isDevelopment 
          ? 'Inngest dev server should auto-discover functions. Make sure npx inngest-cli@latest dev is running.'
          : 'INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY environment variables are required in production'
        console.error(`[Inngest API] ERROR: ${errorMsg}`)
        return NextResponse.json(
          { error: errorMsg },
          { status: 500 }
        )
      },
      POST: async () => {
        const errorMsg = isDevelopment 
          ? 'Inngest dev server should auto-discover functions. Make sure npx inngest-cli@latest dev is running.'
          : 'INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY environment variables are required in production'
        console.error(`[Inngest API] ERROR: ${errorMsg}`)
        return NextResponse.json(
          { error: errorMsg },
          { status: 500 }
        )
      },
      PUT: async () => {
        const errorMsg = isDevelopment 
          ? 'Inngest dev server should auto-discover functions. Make sure npx inngest-cli@latest dev is running.'
          : 'INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY environment variables are required in production'
        console.error(`[Inngest API] ERROR: ${errorMsg}`)
        return NextResponse.json(
          { error: errorMsg },
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

