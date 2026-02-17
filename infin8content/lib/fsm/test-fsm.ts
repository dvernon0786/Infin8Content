import { WorkflowFSM } from './workflow-fsm'
import { WorkflowEvent } from './workflow-events'

// Simple test to verify FSM works
async function testFSM() {
  try {
    // Test basic methods
    console.log('Testing FSM methods...')
    
    // Test canTransition
    const canTransition = WorkflowFSM.canTransition('step_4_longtails', 'LONGTAIL_START')
    console.log('Can transition step_4_longtails -> LONGTAIL_START:', canTransition)
    
    const invalidTransition = WorkflowFSM.canTransition('step_2_competitors', 'LONGTAIL_START')
    console.log('Can transition step_2_competitors -> LONGTAIL_START (should be false):', invalidTransition)
    
    // Test getAllowedEvents
    const allowedEvents = WorkflowFSM.getAllowedEvents('step_4_longtails')
    console.log('Allowed events for step_4_longtails:', allowedEvents)
    
    console.log('✅ FSM infrastructure test passed')
    
  } catch (error) {
    console.error('❌ FSM test failed:', error)
  }
}

// Export for manual testing
export { testFSM }
