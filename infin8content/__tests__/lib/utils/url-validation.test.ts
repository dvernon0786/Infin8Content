// URL Validation Utilities Tests
// Story 33.3: Configure Competitor URLs for Analysis

import { describe, it, expect } from 'vitest'
import { validateAndNormalizeUrl, extractDomain, isValidUrlFormat, isSameDomain } from '@/lib/utils/url-validation'

describe('URL Validation Utilities', () => {
  describe('validateAndNormalizeUrl', () => {
    it('should normalize HTTP to HTTPS', () => {
      const result = validateAndNormalizeUrl('http://example.com')
      expect(result).toBe('https://example.com')
    })

    it('should keep HTTPS URLs unchanged', () => {
      const result = validateAndNormalizeUrl('https://example.com')
      expect(result).toBe('https://example.com')
    })

    it('should remove trailing slashes', () => {
      const result = validateAndNormalizeUrl('https://example.com/')
      expect(result).toBe('https://example.com')
    })

    it('should handle URLs with paths and query params', () => {
      const result = validateAndNormalizeUrl('https://example.com/path?query=value')
      expect(result).toBe('https://example.com/path?query=value')
    })

    it('should reject invalid protocols', () => {
      const result = validateAndNormalizeUrl('ftp://example.com')
      expect(result).toBeNull()
    })

    it('should reject malformed URLs', () => {
      const result = validateAndNormalizeUrl('not-a-url')
      expect(result).toBeNull()
    })

    it('should reject empty strings', () => {
      const result = validateAndNormalizeUrl('')
      expect(result).toBeNull()
    })
  })

  describe('extractDomain', () => {
    it('should extract domain from HTTPS URLs', () => {
      const result = extractDomain('https://example.com')
      expect(result).toBe('example.com')
    })

    it('should extract domain from HTTP URLs', () => {
      const result = extractDomain('http://example.com')
      expect(result).toBe('example.com')
    })

    it('should extract domain with subdomains', () => {
      const result = extractDomain('https://blog.example.com')
      expect(result).toBe('blog.example.com')
    })

    it('should convert to lowercase', () => {
      const result = extractDomain('https://EXAMPLE.COM')
      expect(result).toBe('example.com')
    })

    it('should handle URLs with paths', () => {
      const result = extractDomain('https://example.com/path/to/page')
      expect(result).toBe('example.com')
    })

    it('should return empty string for invalid URLs', () => {
      const result = extractDomain('not-a-url')
      expect(result).toBe('')
    })
  })

  describe('isValidUrlFormat', () => {
    it('should validate correct HTTPS URLs', () => {
      expect(isValidUrlFormat('https://example.com')).toBe(true)
      expect(isValidUrlFormat('https://www.example.com')).toBe(true)
    })

    it('should validate correct HTTP URLs', () => {
      expect(isValidUrlFormat('http://example.com')).toBe(true)
    })

    it('should validate URLs with paths', () => {
      expect(isValidUrlFormat('https://example.com/path')).toBe(true)
    })

    it('should reject invalid protocols', () => {
      expect(isValidUrlFormat('ftp://example.com')).toBe(false)
    })

    it('should reject malformed URLs', () => {
      expect(isValidUrlFormat('not-a-url')).toBe(false)
      expect(isValidUrlFormat('')).toBe(false)
    })
  })

  describe('isSameDomain', () => {
    it('should return true for same domain with different protocols', () => {
      expect(isSameDomain('http://example.com', 'https://example.com')).toBe(true)
    })

    it('should return true for same domain with different paths', () => {
      expect(isSameDomain('https://example.com/path1', 'https://example.com/path2')).toBe(true)
    })

    it('should return true for same domain with different subdomains', () => {
      expect(isSameDomain('https://blog.example.com', 'https://blog.example.com')).toBe(true)
    })

    it('should return false for different domains', () => {
      expect(isSameDomain('https://example.com', 'https://other.com')).toBe(false)
    })

    it('should return false for different subdomains', () => {
      expect(isSameDomain('https://blog.example.com', 'https://shop.example.com')).toBe(false)
    })

    it('should return false for invalid URLs', () => {
      expect(isSameDomain('not-a-url', 'https://example.com')).toBe(false)
      expect(isSameDomain('https://example.com', 'not-a-url')).toBe(false)
    })
  })
})
