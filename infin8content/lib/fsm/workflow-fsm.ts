/**
 * DEPRECATED: This file is kept for backward compatibility only.
 * 
 * The actual FSM implementation has moved to fsm.internal.ts and is NOT exported.
 * All transitions MUST go through unified-workflow-engine.ts
 * 
 * This file now throws errors to prevent direct usage.
 */

import { WorkflowEvent } from './workflow-events'

export interface TransitionResult {
  ok: boolean
  previousState: string
  nextState: string
  applied: boolean
  skipped?: boolean
}

/**
 * FORBIDDEN: This class throws errors to prevent usage.
 * Use transitionWithAutomation() from unified-workflow-engine.ts instead.
 */
export class WorkflowFSM {
  static async getCurrentState(): Promise<never> {
    throw new Error(`
🚨 FORBIDDEN: Direct WorkflowFSM usage detected.

All state queries MUST go through unified engine:
✅ import { transitionWithAutomation } from '@/lib/fsm/unified-workflow-engine'

This prevents bypassing automation guarantees.
    `)
  }

  static async transition(): Promise<never> {
    throw new Error(`
🚨 FORBIDDEN: Direct WorkflowFSM.transition() detected.

All transitions MUST use unified engine:
✅ import { transitionWithAutomation } from '@/lib/fsm/unified-workflow-engine'
✅ await transitionWithAutomation(workflowId, 'EVENT', userId)

This prevents missing event emissions and silent stalls.
    `)
  }

  static getAllowedEvents(): Promise<never> {
    throw new Error(`
🚨 FORBIDDEN: Direct WorkflowFSM usage detected.

Use unified engine for all workflow operations.
    `)
  }

  static canTransition(): Promise<never> {
    throw new Error(`
🚨 FORBIDDEN: Direct WorkflowFSM usage detected.

Use unified engine for all workflow operations.
    `)
  }
}
