/**
 * Validate and sanitize redirect URLs to prevent open redirect vulnerabilities
 * Only allows internal paths that start with / and don't contain // or external URLs
 * 
 * @param redirect - The redirect URL to validate
 * @param defaultPath - Default path to return if redirect is invalid
 * @returns Validated internal path or default path
 */
export function validateRedirect(redirect: string | undefined | null, defaultPath: string = '/dashboard'): string {
  if (!redirect) {
    return defaultPath
  }
  
  // Only allow internal paths starting with /
  if (!redirect.startsWith('/')) {
    return defaultPath
  }
  
  // Prevent protocol-relative URLs (//example.com)
  if (redirect.includes('//')) {
    return defaultPath
  }
  
  // Prevent external URLs (http://, https://, etc.)
  if (redirect.match(/^https?:\/\//i)) {
    return defaultPath
  }
  
  // Allowlist of valid redirect destinations
  // Only allow paths that start with these prefixes
  const allowedPrefixes = [
    '/dashboard',
    '/payment',
    '/settings',
    '/create-organization',
    '/suspended',
  ]
  
  // Check if redirect starts with any allowed prefix
  const isValid = allowedPrefixes.some(prefix => redirect.startsWith(prefix))
  
  if (!isValid) {
    return defaultPath
  }
  
  return redirect
}

