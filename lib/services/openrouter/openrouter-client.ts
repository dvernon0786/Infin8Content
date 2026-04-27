// Named re-exports so Vitest mocks on this specifier are honoured independently
// of the underlying infin8content import path used by the implementation.
export type { OpenRouterMessage } from '../../../infin8content/lib/services/openrouter/openrouter-client'
import * as _impl from '../../../infin8content/lib/services/openrouter/openrouter-client'

export function generateContent(
  ...args: Parameters<typeof _impl.generateContent>
): ReturnType<typeof _impl.generateContent> {
  return _impl.generateContent(...args)
}

