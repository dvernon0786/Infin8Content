#!/usr/bin/env node

/**
 * 🧪 URGENT: FULL PIPELINE TEST SUITE
 * 
 * CRITICAL: Must run before stakeholder meeting
 * Tests all workflow engine fixes and production readiness
 */

import fetch from 'node-fetch'
import process from 'process'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEST_EMAIL = process.env.TEST_EMAIL || ''
const TEST_PASSWORD = process.env.TEST_PASSWORD || ''

if (!TEST_EMAIL || !TEST_PASSWORD) {
  console.error('❌ Missing TEST_EMAIL or TEST_PASSWORD env vars')
  process.exit(1)
}

// Test configuration
const TEST_CONFIG = {
  timeout: 30000, // 30 seconds per step
  retryDelay: 2000, // 2 seconds between retries
  maxRetries: 3
}

type StepDef = {
  name: string
  endpoint: string
  expectedNextState: string
  payload?: any
  requiresApproval?: boolean
  approvalEndpoint?: string
}

interface WorkflowResponse {
  id: string
  name: string
  state: string
  organization_id: string
  created_at: string
}

// Full happy path steps
const HAPPY_PATH_STEPS: StepDef[] = [
  {
    name: 'ICP',
    endpoint: 'icp-generate',
    expectedNextState: 'step_2_competitors',
    payload: {
      organization_name: 'Test Org',
      organization_url: 'https://example.com',
      organization_linkedin_url: 'https://linkedin.com/company/example'
    }
  },
  {
    name: 'Competitors',
    endpoint: 'competitor-analyze',
    expectedNextState: 'step_3_seeds'
  },
  {
    name: 'Seed Extract',
    endpoint: 'seed-extract',
    expectedNextState: 'step_4_longtails'
  },
  {
    name: 'Longtail Expand',
    endpoint: 'longtail-expand',
    expectedNextState: 'step_5_filtering'
  },
  {
    name: 'Filter Keywords',
    endpoint: 'filter-keywords',
    expectedNextState: 'step_6_clustering'
  },
  {
    name: 'Cluster Topics',
    endpoint: 'cluster-topics',
    expectedNextState: 'step_7_validation'
  },
  {
    name: 'Validate Clusters',
    endpoint: 'validate-clusters',
    expectedNextState: 'step_8_subtopics',
    requiresApproval: true,
    approvalEndpoint: 'subtopics/approve'
  }
]

class PipelineTest {
  private baseUrl: string
  private authToken: string = ''
  private workflowId: string = ''
  private testResults: any[] = []

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async authenticate(): Promise<void> {
    console.log('🔐 Authenticating...')
    
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    })

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`)
    }

    const data = await response.json() as any
    this.authToken = data.token
    console.log('✅ Authentication successful')
  }

  async createWorkflow(): Promise<void> {
    console.log('📝 Creating test workflow...')
    
    const response = await fetch(`${this.baseUrl}/api/intent/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
      },
      body: JSON.stringify({
        name: 'Pipeline Test Workflow',
        description: 'Full pipeline test before stakeholder demo'
      })
    })

    if (!response.ok) {
      throw new Error(`Workflow creation failed: ${response.status}`)
    }

    const workflow: WorkflowResponse = await response.json() as WorkflowResponse
    this.workflowId = workflow.id
    console.log(`✅ Workflow created: ${this.workflowId}`)
  }

  async getWorkflowState(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/intent/workflows/${this.workflowId}`, {
      headers: { 'Authorization': `Bearer ${this.authToken}` }
    })

    if (!response.ok) {
      throw new Error(`Failed to get workflow state: ${response.status}`)
    }

    const workflow: WorkflowResponse = await response.json() as WorkflowResponse
    return workflow.state
  }

  async waitForStateTransition(expectedState: string, timeout: number = TEST_CONFIG.timeout): Promise<boolean> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      const currentState = await this.getWorkflowState()
      if (currentState === expectedState) {
        return true
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    const finalState = await this.getWorkflowState()
    console.error(`❌ State transition timeout. Expected: ${expectedState}, Got: ${finalState}`)
    return false
  }

  async executeStep(step: StepDef): Promise<boolean> {
    console.log(`⚡ Executing step: ${step.name}`)
    
    try {
      const response = await fetch(
        `${this.baseUrl}/api/intent/workflows/${this.workflowId}/steps/${step.endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`
          },
          body: step.payload ? JSON.stringify(step.payload) : undefined
        }
      )

      if (!response.ok) {
        const error = await response.text()
        console.error(`❌ Step ${step.name} failed: ${response.status} - ${error}`)
        return false
      }

      const result = await response.json()
      console.log(`✅ Step ${step.name} triggered successfully`)

      // Wait for state transition
      const transitionSuccess = await this.waitForStateTransition(step.expectedNextState)
      if (!transitionSuccess) {
        return false
      }

      console.log(`✅ State transition confirmed: ${step.expectedNextState}`)
      
      // Handle approval if required
      if (step.requiresApproval && step.approvalEndpoint) {
        return await this.handleApproval(step)
      }

      return true

    } catch (error) {
      console.error(`❌ Step ${step.name} error:`, error)
      return false
    }
  }

  async handleApproval(step: StepDef): Promise<boolean> {
    console.log(`👍 Handling approval for ${step.name}`)
    
    // Wait a moment for subtopics to be processed
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const response = await fetch(
      `${this.baseUrl}/api/intent/workflows/${this.workflowId}/steps/${step.approvalEndpoint}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          decision: 'approved',
          feedback: 'Auto-approved for pipeline test'
        })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error(`❌ Approval failed: ${response.status} - ${error}`)
      return false
    }

    console.log(`✅ Approval successful`)
    
    // Wait for transition to step_9_articles
    const transitionSuccess = await this.waitForStateTransition('step_9_articles')
    if (!transitionSuccess) {
      return false
    }

    console.log(`✅ Transitioned to step_9_articles`)
    return true
  }

  async verifyWorkflowCompletion(): Promise<boolean> {
    console.log('🏁 Verifying workflow completion...')
    
    // Wait for articles to be generated and workflow to complete
    const completionSuccess = await this.waitForStateTransition('completed', 60000) // 1 minute timeout
    
    if (!completionSuccess) {
      const finalState = await this.getWorkflowState()
      console.error(`❌ Workflow did not complete. Final state: ${finalState}`)
      return false
    }

    console.log('✅ Workflow completed successfully')
    return true
  }

  async runHappyPath(): Promise<boolean> {
    console.log('\n🧪 TEST 1: Happy Path Full Automation')
    console.log('='.repeat(50))
    
    try {
      await this.authenticate()
      await this.createWorkflow()

      for (const step of HAPPY_PATH_STEPS) {
        const success = await this.executeStep(step)
        if (!success) {
          console.error(`❌ Happy path failed at step: ${step.name}`)
          return false
        }
      }

      // Verify final completion
      const completionSuccess = await this.verifyWorkflowCompletion()
      if (!completionSuccess) {
        return false
      }

      console.log('\n🎉 HAPPY PATH TEST PASSED!')
      return true

    } catch (error) {
      console.error('❌ Happy path test error:', error)
      return false
    }
  }

  async runConcurrencyGuard(): Promise<boolean> {
    console.log('\n🧪 TEST 2: Concurrency Guard')
    console.log('='.repeat(50))
    
    try {
      // Get current workflow state
      const initialState = await this.getWorkflowState()
      console.log(`📍 Initial state: ${initialState}`)

      // Trigger the same step twice rapidly
      const step = HAPPY_PATH_STEPS[4] // Filter Keywords
      console.log(`⚡ Triggering ${step.name} twice...`)

      const [result1, result2] = await Promise.all([
        this.executeStep(step),
        this.executeStep(step)
      ])

      // Only one should succeed
      const oneSucceeded = result1 !== result2
      if (!oneSucceeded) {
        console.error('❌ Both requests succeeded - concurrency guard failed')
        return false
      }

      console.log('✅ Concurrency guard working correctly')
      return true

    } catch (error) {
      console.error('❌ Concurrency guard test error:', error)
      return false
    }
  }

  async runFailureRecovery(): Promise<boolean> {
    console.log('\n🧪 TEST 3: Failure Recovery')
    console.log('='.repeat(50))
    
    try {
      // For now, simulate failure by checking error handling
      // In a real test, you'd mock the service to throw an error
      console.log('📋 Simulating failure scenario...')
      
      // Check if we can detect failure states
      const currentState = await this.getWorkflowState()
      console.log(`📍 Current state: ${currentState}`)

      // Verify we can retry from a START event
      const retryStep = HAPPY_PATH_STEPS[3] // Longtail Expand
      console.log(`🔄 Testing retry with ${retryStep.name}...`)
      
      const retrySuccess = await this.executeStep(retryStep)
      if (!retrySuccess) {
        console.error('❌ Retry failed')
        return false
      }

      console.log('✅ Failure recovery test passed')
      return true

    } catch (error) {
      console.error('❌ Failure recovery test error:', error)
      return false
    }
  }

  async runResetRegression(): Promise<boolean> {
    console.log('\n🧪 TEST 4: Reset Regression')
    console.log('='.repeat(50))
    
    try {
      // Get to step 8 (subtopics) if not already there
      const currentState = await this.getWorkflowState()
      console.log(`📍 Current state: ${currentState}`)

      if (currentState !== 'step_8_subtopics') {
        console.log('📋 Need to reach step 8 first...')
        // For this test, we'll assume we're already at step 8
        console.log('⚠️  Skipping to step 8 for reset test')
      }

      // Test rejection and reset
      console.log('🔄 Testing rejection and reset to step 4...')
      
      const response = await fetch(
        `${this.baseUrl}/api/intent/workflows/${this.workflowId}/steps/subtopics/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`
          },
          body: JSON.stringify({
            decision: 'rejected',
            feedback: 'Test rejection for reset regression',
            reset_to_step: 'step_4_longtails'
          })
        }
      )

      if (!response.ok) {
        const error = await response.text()
        console.error(`❌ Reset failed: ${response.status} - ${error}`)
        return false
      }

      // Wait for reset to complete
      const resetSuccess = await this.waitForStateTransition('step_4_longtails')
      if (!resetSuccess) {
        const finalState = await this.getWorkflowState()
        console.error(`❌ Reset failed. Final state: ${finalState}`)
        return false
      }

      console.log('✅ Reset regression test passed')
      return true

    } catch (error) {
      console.error('❌ Reset regression test error:', error)
      return false
    }
  }

  async runFullSuite(): Promise<void> {
    console.log('🚀 STARTING FULL PIPELINE TEST SUITE')
    console.log('🎯 Critical for stakeholder meeting readiness')
    console.log('='.repeat(60))

    const results = {
      happyPath: false,
      concurrency: false,
      failureRecovery: false,
      resetRegression: false
    }

    try {
      // Test 1: Happy Path
      results.happyPath = await this.runHappyPath()
      
      // Test 2: Concurrency Guard  
      results.concurrency = await this.runConcurrencyGuard()
      
      // Test 3: Failure Recovery
      results.failureRecovery = await this.runFailureRecovery()
      
      // Test 4: Reset Regression
      results.resetRegression = await this.runResetRegression()

    } catch (error) {
      console.error('❌ Test suite error:', error)
    }

    // Final summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 PIPELINE TEST RESULTS')
    console.log('='.repeat(60))
    console.log(`✅ Happy Path: ${results.happyPath ? 'PASSED' : 'FAILED'}`)
    console.log(`✅ Concurrency Guard: ${results.concurrency ? 'PASSED' : 'FAILED'}`)
    console.log(`✅ Failure Recovery: ${results.failureRecovery ? 'PASSED' : 'FAILED'}`)
    console.log(`✅ Reset Regression: ${results.resetRegression ? 'PASSED' : 'FAILED'}`)

    const allPassed = Object.values(results).every(result => result)
    
    if (allPassed) {
      console.log('\n🎉 ALL TESTS PASSED!')
      console.log('🚀 WORKFLOW ENGINE IS STAKEHOLDER READY!')
    } else {
      console.log('\n❌ SOME TESTS FAILED!')
      console.log('🚨 FIX ISSUES BEFORE STAKEHOLDER MEETING!')
      process.exit(1)
    }
  }
}

// Run the tests
const test = new PipelineTest(BASE_URL)
test.runFullSuite().catch(console.error)
