// Named re-exports so Vitest mocks on this specifier are honoured independently
// of the underlying infin8content import path used by the implementation.
import * as _impl from '../../../infin8content/lib/services/article-generation/research-agent'

export type { ResearchAgentInput } from '../../../infin8content/lib/services/article-generation/research-agent'
export type { ResearchPayload } from '../../../infin8content/lib/services/article-generation/research-agent'

export const RESEARCH_AGENT_SYSTEM_PROMPT = _impl.RESEARCH_AGENT_SYSTEM_PROMPT

export function runResearchAgent(
  ...args: Parameters<typeof _impl.runResearchAgent>
): ReturnType<typeof _impl.runResearchAgent> {
  return _impl.runResearchAgent(...args)
}

