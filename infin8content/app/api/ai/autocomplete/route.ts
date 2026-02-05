/**
 * AI Autocomplete API Endpoint
 * Story A-5: Onboarding Agent AI Autocomplete
 * 
 * Provides REST API endpoint for AI-powered autocomplete suggestions
 * with authentication, rate limiting, and privacy protection.
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateAutocompleteSuggestions } from '@/lib/services/ai-autocomplete'
import type { AutocompleteRequest } from '@/types/autocomplete'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: AutocompleteRequest = await request.json()
    
    // Validate required fields
    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      )
    }

    if (!body.context || !['competitors', 'business', 'blog'].includes(body.context)) {
      return NextResponse.json(
        { error: 'Context is required and must be: competitors, business, or blog' },
        { status: 400 }
      )
    }

    // Validate optional fields
    if (body.limit && (typeof body.limit !== 'number' || body.limit < 1 || body.limit > 10)) {
      return NextResponse.json(
        { error: 'Limit must be a number between 1 and 10' },
        { status: 400 }
      )
    }

    // Generate suggestions
    const result = await generateAutocompleteSuggestions(body)

    // Return response
    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('Autocomplete API error:', error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Authentication required')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      if (error.message.includes('Rate limit exceeded')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }

      if (error.message.includes('Invalid context') || 
          error.message.includes('Query must be at least') ||
          error.message.includes('Limit cannot exceed')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }

    // Generic error response
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
