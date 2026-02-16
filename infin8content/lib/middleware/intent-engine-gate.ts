import { NextRequest, NextResponse } from 'next/server'
import { ICPGateValidator, type GateResult } from '@/lib/services/intent-engine/icp-gate-validator'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { CompetitorGateValidator } from '@/lib/services/intent-engine/competitor-gate-validator'
import { SeedApprovalGateValidator } from '@/lib/services/intent-engine/seed-approval-gate-validator'
import { SubtopicApprovalGateValidator } from '@/lib/services/intent-engine/subtopic-approval-gate-validator'

const icpGateValidator = new ICPGateValidator()
const competitorGateValidator = new CompetitorGateValidator()
const seedApprovalGateValidator = new SeedApprovalGateValidator()
const subtopicApprovalGateValidator = new SubtopicApprovalGateValidator()

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

/**
 * Enforces competitor analysis completion gate for Intent Engine workflow steps
 * 
 * This middleware checks if competitor analysis is complete before allowing
 * access to seed keyword extraction and downstream steps. If competitor analysis
 * is not complete, it returns a 423 Blocked response with actionable error details.
 * 
 * @param workflowId - The workflow ID to validate
 * @param stepName - The name of the step being attempted
 * @returns Promise<NextResponse | null> - Returns 423 response if blocked, null if allowed
 */
export async function enforceCompetitorGate(
  workflowId: string,
  stepName: string
): Promise<NextResponse | null> {
  try {
    // Validate competitor analysis completion
    const result = await competitorGateValidator.validateCompetitorCompletion(workflowId)
    
    // If access is allowed, continue to next handler
    if (result.allowed) {
      return null
    }
    
    // Log gate enforcement for audit trail (non-blocking)
    competitorGateValidator.logGateEnforcement(workflowId, stepName, result).catch(error => {
      console.error('Failed to log gate enforcement:', error)
    })
    
    // Return 423 Blocked response with actionable error details
    return NextResponse.json(result.errorResponse || {
      error: result.error || `Competitor analysis required before ${stepName}`,
      workflowStatus: result.workflowStatus,
      competitorStatus: result.competitorStatus,
      requiredAction: 'Complete competitor analysis (step 2) before proceeding',
      currentStep: stepName,
      blockedAt: new Date().toISOString()
    }, { status: 423 })
    
  } catch (error) {
    console.error('Competitor gate enforcement error:', error)
    
    // Fail open for availability - don't block requests due to gate failures
    // Log the error for monitoring
    try {
      await competitorGateValidator.logGateEnforcement(workflowId, stepName, {
        allowed: true,
        competitorStatus: 'error',
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
 *   // Enforce competitor gate
 *   const gateResponse = await enforceCompetitorGate(workflow_id, 'seed-extract')
 *   if (gateResponse) {
 *     return gateResponse
 *   }
 *   
 *   // Continue with step logic...
 * }
 * ```
 */
export function withCompetitorGate(stepName: string) {
  return async (workflowId: string): Promise<NextResponse | null> => {
    return enforceCompetitorGate(workflowId, stepName)
  }
}

/**
 * Enforces seed approval gate for Intent Engine workflow steps
 * 
 * This middleware checks if seed keywords have been approved before allowing
 * access to long-tail expansion and downstream steps. If seed approval is not
 * complete, it returns a 423 Blocked response with actionable error details.
 * 
 * @param workflowId - The workflow ID to validate
 * @param stepName - The name of the step being attempted
 * @returns Promise<NextResponse | null> - Returns 423 response if blocked, null if allowed
 */
export async function enforceSeedApprovalGate(
  workflowId: string,
  stepName: string
): Promise<NextResponse | null> {
  try {
    // Validate seed approval
    const supabase = createServiceRoleClient()
    const { data: workflow } = await supabase.from('intent_workflows').select('organization_id').eq('id', workflowId).single() as { data: { organization_id: string } | null }
    const organizationId = workflow?.organization_id || ''
    const userId = '00000000-0000-0000-0000-000000000000' // System user
    const result = await seedApprovalGateValidator.validateGate(workflowId, organizationId, userId)
    
    // If access is allowed, continue to next handler
    if (result.allowed) {
      return null
    }
    
    // Log gate enforcement for audit trail (non-blocking)
    seedApprovalGateValidator.logGateEnforcement(workflowId, stepName, result).catch(error => {
      console.error('Failed to log gate enforcement:', error)
    })
    
    // Return 423 Blocked response with actionable error details
    return NextResponse.json(result.errorResponse || {
      error: result.error || `Seed approval required before ${stepName}`,
      workflowState: result.workflowState,
      seedApprovalStatus: result.seedApprovalStatus,
      requiredAction: 'Approve seed keywords via POST /api/intent/workflows/{workflow_id}/steps/approve-seeds',
      currentStep: stepName,
      blockedAt: new Date().toISOString()
    }, { status: 423 })
    
  } catch (error) {
    console.error('Seed approval gate enforcement error:', error)
    
    // Fail open for availability - don't block requests due to gate failures
    // Log the error for monitoring
    try {
      await seedApprovalGateValidator.logGateEnforcement(workflowId, stepName, {
        allowed: true,
        seedApprovalStatus: 'error',
        workflowState: 'error',
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
 *   // Enforce seed approval gate
 *   const gateResponse = await enforceSeedApprovalGate(workflow_id, 'longtail-expand')
 *   if (gateResponse) {
 *     return gateResponse
 *   }
 *   
 *   // Continue with step logic...
 * }
 * ```
 */
export function withSeedApprovalGate(stepName: string) {
  return async (workflowId: string): Promise<NextResponse | null> => {
    return enforceSeedApprovalGate(workflowId, stepName)
  }
}

/**
 * Enforces subtopic approval gate for Intent Engine workflow steps
 * 
 * This middleware checks if subtopics have been approved before allowing
 * access to article generation and downstream steps. If subtopic approval is not
 * complete, it returns a 423 Blocked response with actionable error details.
 * 
 * @param workflowId - The workflow ID to validate
 * @param stepName - The name of the step being attempted
 * @returns Promise<NextResponse | null> - Returns 423 response if blocked, null if allowed
 */
export async function enforceSubtopicApprovalGate(
  workflowId: string,
  stepName: string
): Promise<NextResponse | null> {
  try {
    // Validate subtopic approval
    const result = await subtopicApprovalGateValidator.validateSubtopicApproval(workflowId)
    
    // If access is allowed, continue to next handler
    if (result.allowed) {
      return null
    }
    
    // Log gate enforcement for audit trail (non-blocking)
    subtopicApprovalGateValidator.logGateEnforcement(workflowId, stepName, result).catch(error => {
      console.error('Failed to log gate enforcement:', error)
    })
    
    // Return 423 Blocked response with actionable error details
    return NextResponse.json(result.errorResponse || {
      error: result.error || `Subtopic approval required before ${stepName}`,
      workflowStatus: result.workflowStatus,
      subtopicApprovalStatus: result.subtopicApprovalStatus,
      requiredAction: 'Approve subtopics via keyword approval endpoints',
      currentStep: stepName,
      blockedAt: new Date().toISOString()
    }, { status: 423 })
    
  } catch (error) {
    console.error('Subtopic approval gate enforcement error:', error)
    
    // Fail open for availability - don't block requests due to gate failures
    // Log the error for monitoring
    try {
      await subtopicApprovalGateValidator.logGateEnforcement(workflowId, stepName, {
        allowed: true,
        subtopicApprovalStatus: 'error',
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
 *   // Enforce subtopic approval gate
 *   const gateResponse = await enforceSubtopicApprovalGate(workflow_id, 'article-generation')
 *   if (gateResponse) {
 *     return gateResponse
 *   }
 *   
 *   // Continue with step logic...
 * }
 * ```
 */
export function withSubtopicApprovalGate(stepName: string) {
  return async (workflowId: string): Promise<NextResponse | null> => {
    return enforceSubtopicApprovalGate(workflowId, stepName)
  }
}
