import crypto from 'crypto';

export function hashPrompt(prompt: string): string {
  return crypto
    .createHash('sha256')
    .update(prompt, 'utf8')
    .digest('hex');
}

export class PromptIntegrityError extends Error {
  public readonly code = 'PROMPT_MUTATION_DETECTED';
  constructor(message: string) {
    super(message);
    this.name = 'PromptIntegrityError';
  }
}

export function assertPromptIntegrity(
  templatePrompt: string,
  expectedHash: string,
  promptName: string
): void {
  const runtimeHash = hashPrompt(templatePrompt);
  if (runtimeHash !== expectedHash) {
    throw new PromptIntegrityError(
      `${promptName} system prompt template has been modified at runtime.`
    );
  }
}

export function assertNoUnresolvedPlaceholders(prompt: string): void {
  // Check for unresolved template placeholders (e.g., {section_header}, {tone}, etc.)
  // This regex matches {word} patterns that are template placeholders
  const placeholderPattern = /\{[a-z_]+\}/gi;
  const matches = prompt.match(placeholderPattern);
  
  if (matches && matches.length > 0) {
    throw new Error(
      `Prompt interpolation incomplete: unresolved placeholders detected: ${matches.join(', ')}`
    );
  }
}
