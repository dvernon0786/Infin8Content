/**
 * Test script for normalized workflow state engine
 * Verifies that step derivation works correctly from state alone
 */

import { WorkflowState } from './infin8content/types/workflow-state'
import { getStepFromState, getStatusFromState, canAccessStep } from './infin8content/lib/services/workflow-engine/workflow-progression'

// Test cases for state-to-step mapping
const testCases = [
  { state: WorkflowState.CREATED, expectedStep: 1, expectedStatus: 'step_1_icp' },
  { state: WorkflowState.ICP_PENDING, expectedStep: 1, expectedStatus: 'step_1_icp' },
  { state: WorkflowState.ICP_PROCESSING, expectedStep: 1, expectedStatus: 'step_1_icp' },
  { state: WorkflowState.ICP_COMPLETED, expectedStep: 2, expectedStatus: 'step_2_competitors' },
  { state: WorkflowState.COMPETITOR_PENDING, expectedStep: 2, expectedStatus: 'step_2_competitors' },
  { state: WorkflowState.COMPETITOR_PROCESSING, expectedStep: 2, expectedStatus: 'step_2_competitors' },
  { state: WorkflowState.COMPETITOR_COMPLETED, expectedStep: 3, expectedStatus: 'step_3_keywords' },
  { state: WorkflowState.CLUSTERING_PENDING, expectedStep: 3, expectedStatus: 'step_3_keywords' },
  { state: WorkflowState.CLUSTERING_PROCESSING, expectedStep: 3, expectedStatus: 'step_3_keywords' },
  { state: WorkflowState.CLUSTERING_COMPLETED, expectedStep: 4, expectedStatus: 'step_4_topics' },
  { state: WorkflowState.VALIDATION_COMPLETED, expectedStep: 5, expectedStatus: 'step_5_generation' },
  { state: WorkflowState.ARTICLE_COMPLETED, expectedStep: 6, expectedStatus: 'step_6_generation' },
  { state: WorkflowState.PUBLISH_COMPLETED, expectedStep: 7, expectedStatus: 'completed' },
  { state: WorkflowState.COMPLETED, expectedStep: 7, expectedStatus: 'completed' },
]

console.log('🧪 Testing Normalized Workflow State Engine\n')

// Test state-to-step mapping
console.log('📊 State-to-Step Mapping Tests:')
testCases.forEach(({ state, expectedStep, expectedStatus }) => {
  const actualStep = getStepFromState(state)
  const actualStatus = getStatusFromState(state)
  
  const stepPassed = actualStep === expectedStep
  const statusPassed = actualStatus === expectedStatus
  
  console.log(`${stepPassed ? '✅' : '❌'} ${state} → Step ${actualStep} (${expectedStep}) | Status: ${actualStatus} (${expectedStatus})`)
})

// Test access control
console.log('\n🔐 Access Control Tests:')
const accessTests = [
  { currentState: WorkflowState.ICP_COMPLETED, targetStep: 1, expected: true },
  { currentState: WorkflowState.ICP_COMPLETED, targetStep: 2, expected: true },
  { currentState: WorkflowState.ICP_COMPLETED, targetStep: 3, expected: false },
  { currentState: WorkflowState.COMPETITOR_COMPLETED, targetStep: 2, expected: true },
  { currentState: WorkflowState.COMPETITOR_COMPLETED, targetStep: 3, expected: true },
  { currentState: WorkflowState.COMPETITOR_COMPLETED, targetStep: 4, expected: false },
]

accessTests.forEach(({ currentState, targetStep, expected }) => {
  const actual = canAccessStep(currentState, targetStep)
  console.log(`${actual === expected ? '✅' : '❌'} ${currentState} can access Step ${targetStep}: ${actual} (${expected})`)
})

// Test edge cases
console.log('\n🎯 Edge Case Tests:')
const edgeCases = [
  { state: WorkflowState.CANCELLED, expectedStep: 1 },
  { state: WorkflowState.ICP_FAILED, expectedStep: 1 },
  { state: WorkflowState.COMPETITOR_FAILED, expectedStep: 2 },
  { state: WorkflowState.CLUSTERING_FAILED, expectedStep: 3 },
]

edgeCases.forEach(({ state, expectedStep }) => {
  const actualStep = getStepFromState(state)
  console.log(`${actualStep === expectedStep ? '✅' : '❌'} Failed state ${state} → Step ${actualStep} (${expectedStep})`)
})

console.log('\n🎉 Normalized workflow state engine test complete!')
console.log('📝 Summary: All step numbers are now derived from state alone')
console.log('🚀 Benefits: No drift, no sync logic, single source of truth')
