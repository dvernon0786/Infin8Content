/**
 * Sanitize text input by stripping HTML tags and escaping special characters
 * Used for user-provided text that will be used in prompts or stored in database
 * 
 * @param text - The text to sanitize
 * @returns Sanitized text with HTML tags removed and special characters escaped
 */
export function sanitizeText(text: string): string {
  if (!text) {
    return ''
  }

  // Strip HTML tags using regex (simple approach for prompt text)
  // This removes <tag>content</tag> patterns
  let sanitized = text.replace(/<[^>]*>/g, '')

  // Escape special characters that could cause issues in prompts or JSON
  sanitized = sanitized
    .replace(/\\/g, '\\\\') // Escape backslashes
    .replace(/"/g, '\\"')   // Escape double quotes
    .replace(/'/g, "\\'")   // Escape single quotes
    .replace(/\n/g, '\\n')  // Escape newlines
    .replace(/\r/g, '\\r')  // Escape carriage returns
    .replace(/\t/g, '\\t')  // Escape tabs

  return sanitized.trim()
}

