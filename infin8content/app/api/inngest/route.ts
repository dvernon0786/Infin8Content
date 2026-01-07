import { serve } from 'inngest/next'
import { generateArticle } from '@/lib/inngest/functions/generate-article'
import { NextResponse } from 'next/server'

// Validate environment variables at runtime (not build time)
const clientId = process.env.INNGEST_EVENT_KEY
const signingKey = process.env.INNGEST_SIGNING_KEY

// Create handlers only if env vars are set
const handlers = clientId
  ? serve({
      clientId,
      signingKey,
      functions: [generateArticle],
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

