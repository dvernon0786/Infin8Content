/**
 * Guardrail Test
 * Ensures Planner Agent NEVER uses openrouter/auto
 * Story 38.1 – architectural safety check
 */

import fs from 'fs'
import path from 'path'

describe('Planner Agent LLM Guardrail', () => {
  it('must NOT use openrouter/auto as model', () => {
    const plannerAgentPath = path.resolve(
      __dirname,
      '../../lib/agents/planner-agent.ts'
    )

    const source = fs.readFileSync(plannerAgentPath, 'utf-8')

    expect(source).not.toContain(`model: 'openrouter/auto'`)
    expect(source).not.toContain(`model:"openrouter/auto"`)
    expect(source).not.toContain(`openrouter/auto`)
  })

  it('must explicitly declare Gemini primary + Perplexity fallback', () => {
    const plannerAgentPath = path.resolve(
      __dirname,
      '../../lib/agents/planner-agent.ts'
    )

    const source = fs.readFileSync(plannerAgentPath, 'utf-8')

    expect(source).toContain(`google/gemini-3-flash-preview`)
    expect(source).toContain(`perplexity/sonar`)
  })
})
