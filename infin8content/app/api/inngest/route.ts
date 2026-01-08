import { serve } from 'inngest/next'
import { generateArticle } from '@/lib/inngest/functions/generate-article'
import { cleanupStuckArticles } from '@/lib/inngest/functions/cleanup-stuck-articles'
import { inngest } from '@/lib/inngest/client'
import { NextResponse } from 'next/server'

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
        return NextResponse.json(
          { error: 'INNGEST_EVENT_KEY environment variable is not set' },
          { status: 500 }
        )
      },
      POST: async () => {
        return NextResponse.json(
          { error: 'INNGEST_EVENT_KEY environment variable is not set' },
          { status: 500 }
        )
      },
      PUT: async () => {
        return NextResponse.json(
          { error: 'INNGEST_EVENT_KEY environment variable is not set' },
          { status: 500 }
        )
      },
    }

export const { GET, POST, PUT } = handlers

