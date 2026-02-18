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

// Production-only validation - never disable in development
if (!isDevelopment && !eventKey) {
  throw new Error('INNGEST_EVENT_KEY is required in production')
}

if (!isDevelopment && !isTest && !signingKey) {
  throw new Error('INNGEST_SIGNING_KEY is required in production')
}

// Always serve Inngest functions - no 503 disable logic
export const { GET, POST, PUT } = serve({
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


