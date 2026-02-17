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

if (!eventKey) {
  throw new Error('INNGEST_EVENT_KEY is required')
}

if (!isDevelopment && !signingKey) {
  throw new Error('INNGEST_SIGNING_KEY is required in production')
}

// Create clean production handlers
export const { GET, POST, PUT } = serve({
  client: inngest,
  signingKey,
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


