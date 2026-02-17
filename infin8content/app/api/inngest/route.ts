import { serve } from 'inngest/next'
import { generateArticle } from '@/lib/inngest/functions/generate-article'
import { cleanupStuckArticles } from '@/lib/inngest/functions/cleanup-stuck-articles'
import { uxMetricsRollup } from '@/lib/inngest/functions/ux-metrics-rollup'
import { inngest } from '@/lib/inngest/client'
import { 
  step4Longtails,
  step5Filtering,
  step6Clustering,
  step7Validation,
  step8Subtopics,
  step9Articles
} from '@/lib/inngest/functions/intent-pipeline'

// Validate environment variables at runtime
const eventKey = process.env.INNGEST_EVENT_KEY
const signingKey = process.env.INNGEST_SIGNING_KEY
const isDevelopment = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test' || process.env.CI === 'true'

// Create handlers based on environment configuration
let handlers: { GET: any; POST: any; PUT: any }

if (!eventKey) {
  console.warn('INNGEST_EVENT_KEY not set, Inngest route disabled')
  
  // Provide disabled handlers
  handlers = {
    GET: () => new Response('Inngest disabled - missing INNGEST_EVENT_KEY', { status: 503 }),
    POST: () => new Response('Inngest disabled - missing INNGEST_EVENT_KEY', { status: 503 }),
    PUT: () => new Response('Inngest disabled - missing INNGEST_EVENT_KEY', { status: 503 })
  }
} else {
  // INNGEST_SIGNING_KEY is required in production only
  if (!isDevelopment && !isTest && !signingKey) {
    throw new Error('INNGEST_SIGNING_KEY is required in production')
  }

  // Create clean production handlers
  // In test/CI environments, signingKey may be undefined for build validation
  handlers = serve({
    client: inngest,
    signingKey: isTest ? undefined : signingKey,
    functions: [
      generateArticle, 
      cleanupStuckArticles, 
      uxMetricsRollup,
      step4Longtails,
      step5Filtering,
      step6Clustering,
      step7Validation,
      step8Subtopics,
      step9Articles
    ],
  })
}

// Export the handlers
export const { GET, POST, PUT } = handlers


