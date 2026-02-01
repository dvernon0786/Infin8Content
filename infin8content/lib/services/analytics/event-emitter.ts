/**
 * Analytics Event Emitter
 * Story 34.3: Harden ICP Generation with Automatic Retry & Failure Recovery
 * 
 * Provides a queue-based analytics event system that can be integrated with
 * various analytics platforms (Segment, Mixpanel, internal event queue, etc.)
 */

export interface AnalyticsEvent {
  event_type: string
  timestamp: string
  organization_id: string
  workflow_id?: string
  [key: string]: any
}

// In-memory event queue for analytics events
// In production, this would be replaced with a proper message queue (Redis, RabbitMQ, etc.)
const eventQueue: AnalyticsEvent[] = []
const MAX_QUEUE_SIZE = 1000

/**
 * Emit an analytics event
 * 
 * Queues the event for processing. In production, this would send to an analytics
 * platform or message queue. For now, events are queued in memory and can be
 * processed asynchronously.
 * 
 * @param event - Analytics event to emit
 */
export function emitAnalyticsEvent(event: AnalyticsEvent): void {
  // Add timestamp if not provided
  if (!event.timestamp) {
    event.timestamp = new Date().toISOString()
  }

  // Add to queue
  if (eventQueue.length < MAX_QUEUE_SIZE) {
    eventQueue.push(event)
    console.log(`[Analytics] Event queued: ${event.event_type}`, event)
  } else {
    console.warn(`[Analytics] Event queue full, dropping event: ${event.event_type}`)
  }

  // In production, this would trigger async processing to send to analytics platform
  // For now, we just queue it
}

/**
 * Get all queued analytics events
 * 
 * Used for testing and debugging. In production, this would be called by
 * a background worker that sends events to the analytics platform.
 * 
 * @returns Array of queued analytics events
 */
export function getQueuedEvents(): AnalyticsEvent[] {
  return [...eventQueue]
}

/**
 * Clear the analytics event queue
 * 
 * Used for testing. In production, events would be cleared after successful
 * delivery to the analytics platform.
 */
export function clearEventQueue(): void {
  eventQueue.length = 0
}

/**
 * Process queued analytics events
 * 
 * This function should be called periodically (e.g., every 5 seconds) by a
 * background worker to send queued events to the analytics platform.
 * 
 * In production, this would:
 * 1. Batch events by organization
 * 2. Send to analytics platform (Segment, Mixpanel, etc.)
 * 3. Remove successfully sent events from queue
 * 4. Retry failed events with exponential backoff
 * 
 * @returns Number of events processed
 */
export async function processQueuedEvents(): Promise<number> {
  if (eventQueue.length === 0) {
    return 0
  }

  const eventsToProcess = [...eventQueue]
  
  try {
    // TODO: Integrate with actual analytics platform
    // For now, just log that we're processing events
    console.log(`[Analytics] Processing ${eventsToProcess.length} queued events`)
    
    // In production, send to analytics platform here
    // await sendToAnalyticsPlatform(eventsToProcess)
    
    // Clear processed events from queue
    eventQueue.length = 0
    
    return eventsToProcess.length
  } catch (error) {
    console.error('[Analytics] Failed to process queued events:', error)
    // Keep events in queue for retry
    return 0
  }
}

/**
 * Get analytics event queue size
 * 
 * @returns Number of events currently in queue
 */
export function getQueueSize(): number {
  return eventQueue.length
}
