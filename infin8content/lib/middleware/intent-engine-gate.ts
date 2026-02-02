import { NextRequest, NextResponse } from 'next/server'
import { ICPGateValidator, type GateResult } from '@/lib/services/intent-engine/icp-gate-validator'

const icpGateValidator = new ICPGateValidator()

/**
 * Enforces ICP completion gate for Intent Engine workflow steps
 * 
 * This middleware checks if ICP (Ideal Customer Profile) generation is complete
 * before allowing access to downstream workflow steps. If ICP is not complete,
 * it returns a 423 Blocked response with actionable error details.
 * 
 * @param workflowId - The workflow ID to validate
 * @param stepName - The name of the step being attempted
 * @returns Promise<NextResponse | null> - Returns 423 response if blocked, null if allowed
 */
export async function enforceICPGate(
  workflowId: string,
  stepName: string
): Promise<NextResponse | null> {
  try {
    // Validate ICP completion
    const result = await icpGateValidator.validateICPCompletion(workflowId)
    
    // If access is allowed, continue to next handler
    if (result.allowed) {
      return null
    }
    
    // Log gate enforcement for audit trail (non-blocking)
    icpGateValidator.logGateEnforcement(workflowId, stepName, result).catch(error => {
      console.error('Failed to log gate enforcement:', error)
    })
    
    // Return 423 Blocked response with actionable error details
    return NextResponse.json(result.errorResponse || {
      error: result.error || `ICP completion required before ${stepName}`,
      workflowStatus: result.workflowStatus,
      icpStatus: result.icpStatus,
      requiredAction: 'Complete ICP generation (step 2) before proceeding',
      currentStep: stepName,
      blockedAt: new Date().toISOString()
    }, { status: 423 })
    
  } catch (error) {
    console.error('ICP gate enforcement error:', error)
    
    // Fail open for availability - don't block requests due to gate failures
    // Log the error for monitoring
    try {
      await icpGateValidator.logGateEnforcement(workflowId, stepName, {
        allowed: true,
        icpStatus: 'error',
        workflowStatus: 'error',
        error: 'Gate enforcement failed - failing open for availability'
      })
    } catch (logError) {
      console.error('Failed to log gate enforcement error:', logError)
    }
    
    // Allow request to proceed
    return null
  }
}

/**
 * Higher-order function that creates a middleware wrapper for specific steps
 * 
 * Usage:
 * ```typescript
 * export async function POST(request: NextRequest, { params }: { params: Promise<{ workflow_id: string }> }) {
 *   const { workflow_id } = await params
 *   
 *   // Enforce ICP gate
 *   const gateResponse = await enforceICPGate(workflow_id, 'competitor-analyze')
 *   if (gateResponse) {
 *     return gateResponse
 *   }
 *   
 *   // Continue with step logic...
 * }
 * ```
 */
export function withICPGate(stepName: string) {
  return async (workflowId: string): Promise<NextResponse | null> => {
    return enforceICPGate(workflowId, stepName)
  }
}
