/**
 * Shared factory for NextRequest test mocks
 * 
 * This provides a consistent way to create NextRequest objects
 * for API route tests.
 */

import { NextRequest } from 'next/server'

export function mockNextRequest(
  url = 'http://localhost/api/test',
  init?: any
) {
  return new NextRequest(url, init)
}
