import { describe, it, expect } from 'vitest'
import { GET, POST } from '../app/api/articles/[article_id]/cancel/route'
import { NextRequest } from 'next/server'

describe('Article API Routes - Param Handling', () => {
  it('should accept article_id param without 404', async () => {
    // Test that the route resolves with article_id param
    const request = new NextRequest('http://localhost:3000/api/articles/test-article-id/cancel', {
      method: 'POST',
      body: JSON.stringify({})
    })
    
    const mockParams = Promise.resolve({ article_id: 'test-article-id' })
    
    // This should not throw a routing error
    expect(async () => {
      await POST(request, { params: mockParams })
    }).not.toThrow()
  })

  it('should return 401 for unauthenticated requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/articles/test-article-id/cancel', {
      method: 'POST',
      body: JSON.stringify({})
    })
    
    const mockParams = Promise.resolve({ article_id: 'test-article-id' })
    
    const response = await POST(request, { params: mockParams })
    expect(response.status).toBe(401)
  })
})

describe('Deprecated [id] Routes', () => {
  it('should return 410 Gone for deprecated [id] endpoints', async () => {
    const request = new NextRequest('http://localhost:3000/api/articles/old-id')
    
    const mockParams = Promise.resolve({ id: 'old-id' })
    
    // Import the deprecated route
    const { GET } = await import('../app/api/articles/[id]/route')
    
    const response = await GET(request, { params: mockParams })
    expect(response.status).toBe(410)
    
    const body = await response.json()
    expect(body.error).toBe("This endpoint has been deprecated.")
    expect(body.correct_endpoint).toBe("/api/articles/old-id")
  })
})
