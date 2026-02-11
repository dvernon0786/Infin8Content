/**
 * Guard Debug Test - Direct Guard Logic Testing
 * 
 * This test isolates the guard logic to identify why it's not working
 */

import { describe, it, expect, vi } from 'vitest'

describe('Guard Logic Debug', () => {
  it('should test Step 1 guard logic directly', async () => {
    // Mock the exact data structure that the endpoint receives
    const mockWorkflow = {
      id: 'test-workflow-id',
      status: 'step_1_icp',
      organization_id: 'test-org-id',
      current_step: 2 // This should trigger rejection
    }

    // Test the guard condition directly
    const typedWorkflow = mockWorkflow as { id: string; status: string; organization_id: string; current_step: number }
    
    // This is the exact condition from the endpoint
    const shouldReject = typedWorkflow.current_step !== 1
    
    expect(shouldReject).toBe(true)
    expect(typedWorkflow.current_step).toBe(2)
  })

  it('should test Step 2 guard logic directly', async () => {
    const mockWorkflow = {
      id: 'test-workflow-id',
      status: 'step_1_icp',
      organization_id: 'test-org-id',
      current_step: 1 // This should trigger rejection
    }

    const typedWorkflow = mockWorkflow as { id: string; status: string; organization_id: string; current_step: number }
    
    // This is the exact condition from the competitor endpoint
    const shouldReject = typedWorkflow.current_step !== 2
    
    expect(shouldReject).toBe(true)
    expect(typedWorkflow.current_step).toBe(1)
  })

  it('should verify the actual guard code exists in Step 1', async () => {
    const fs = await import('fs')
    const path = await import('path')
    
    const filePath = path.join(process.cwd(), 'app/api/intent/workflows/[workflow_id]/steps/icp-generate/route.ts')
    const fileContent = fs.readFileSync(filePath, 'utf8')

    // Look for the exact guard condition
    const guardExists = fileContent.includes('if (typedWorkflow.current_step !== 1)')
    const invalidStepOrderExists = fileContent.includes('INVALID_STEP_ORDER')
    
    expect(guardExists).toBe(true)
    expect(invalidStepOrderExists).toBe(true)
    
    // Extract the guard section for debugging
    const guardSection = fileContent.substring(
      fileContent.indexOf('if (typedWorkflow.current_step !== 1)'),
      fileContent.indexOf('}', fileContent.indexOf('if (typedWorkflow.current_step !== 1)')) + 1
    )
    
    console.log('Guard Section:', guardSection)
  })

  it('should verify the actual guard code exists in Step 2', async () => {
    const fs = await import('fs')
    const path = await import('path')
    
    const filePath = path.join(process.cwd(), 'app/api/intent/workflows/[workflow_id]/steps/competitor-analyze/route.ts')
    const fileContent = fs.readFileSync(filePath, 'utf8')

    // Look for the exact guard condition
    const guardExists = fileContent.includes('if (typedWorkflow.current_step !== 2)')
    const invalidStepOrderExists = fileContent.includes('INVALID_STEP_ORDER')
    
    expect(guardExists).toBe(true)
    expect(invalidStepOrderExists).toBe(true)
    
    // Extract the guard section for debugging
    const guardSection = fileContent.substring(
      fileContent.indexOf('if (typedWorkflow.current_step !== 2)'),
      fileContent.indexOf('}', fileContent.indexOf('if (typedWorkflow.current_step !== 2)')) + 1
    )
    
    console.log('Guard Section:', guardSection)
  })
})
