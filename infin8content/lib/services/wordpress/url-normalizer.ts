/**
 * Normalize WordPress URLs to prevent subtle bugs
 * 
 * Users paste various formats:
 * - https://site.com/
 * - https://site.com/wp-admin
 * - https://site.com/wp-json
 * 
 * This function normalizes to the base URL.
 */
export function normalizeWordPressUrl(url: string): string {
  try {
    const parsed = new URL(url)
    
    // Remove wp-admin, wp-json, and other WordPress paths
    const cleanPath = parsed.pathname
      .replace(/\/(wp-admin|wp-json|wp-content|wp-includes).*$/, '')
      .replace(/\/$/, '') // Remove trailing slash
    
    // Reconstruct URL with clean path
    return `${parsed.protocol}//${parsed.host}${cleanPath}`
  } catch (error) {
    // If URL parsing fails, return as-is (validation will catch it)
    return url
  }
}

/**
 * Validate WordPress URL format
 */
export function isValidWordPressUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}
