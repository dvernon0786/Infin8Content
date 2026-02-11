/**
 * Health Check API Endpoint
 * 
 * GET /api/health
 * Returns server health status for E2E testing
 */

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
}
