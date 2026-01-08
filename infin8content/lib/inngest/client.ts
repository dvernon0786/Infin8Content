import { Inngest } from 'inngest'

// For local development, Inngest dev server doesn't require an event key
// For production, INNGEST_EVENT_KEY is required
const eventKey = process.env.INNGEST_EVENT_KEY || (process.env.NODE_ENV === 'development' ? undefined : undefined)

if (!eventKey && process.env.NODE_ENV === 'production') {
  console.warn('[Inngest] WARNING: INNGEST_EVENT_KEY is not set. Inngest events may not work in production.')
}

export const inngest = new Inngest({
  id: 'infin8content',
  eventKey: eventKey,
})

// Log Inngest client initialization
if (process.env.NODE_ENV === 'development') {
  console.log('[Inngest] Client initialized:', {
    id: 'infin8content',
    hasEventKey: !!eventKey,
    nodeEnv: process.env.NODE_ENV,
  })
}

