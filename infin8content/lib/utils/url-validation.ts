/**
 * URL Validation and Normalization Utilities
 * Story 33.3: Configure Competitor URLs for Analysis
 */

/**
 * Validates and normalizes a URL
 * Ensures HTTPS protocol and removes trailing slash
 * 
 * @param url - The URL to validate and normalize
 * @returns Normalized HTTPS URL or null if invalid
 */
export function validateAndNormalizeUrl(url: string): string | null {
  try {
    // Basic format validation
    const urlObj = new URL(url)
    
    // Only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null
    }
    
    // Normalize to HTTPS
    if (urlObj.protocol === 'http:') {
      urlObj.protocol = 'https:'
    }
    
    // Remove trailing slash
    const normalized = urlObj.toString().replace(/\/$/, '')
    
    return normalized
  } catch {
    return null
  }
}

/**
 * Extracts domain from a URL
 * 
 * @param url - The URL to extract domain from
 * @returns Lowercase hostname or empty string if invalid
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.toLowerCase()
  } catch {
    return ''
  }
}

/**
 * Validates URL format using regex
 * Less strict than validateAndNormalizeUrl, used for basic validation
 * 
 * @param url - The URL to validate
 * @returns True if URL format is valid
 */
export function isValidUrlFormat(url: string): boolean {
  const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/
  return urlPattern.test(url)
}

/**
 * Checks if a URL is from the same domain (for duplicate detection)
 * 
 * @param url1 - First URL
 * @param url2 - Second URL
 * @returns True if both URLs have the same domain
 */
export function isSameDomain(url1: string, url2: string): boolean {
  const domain1 = extractDomain(url1)
  const domain2 = extractDomain(url2)
  return domain1 === domain2 && domain1 !== ''
}
