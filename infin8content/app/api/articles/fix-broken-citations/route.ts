/**
 * API Endpoint: Fix Broken Citations
 * Purpose: Cleanup broken citations in existing articles
 * Story: Article Formatting Fix (2026-01-13)
 */

import { NextRequest, NextResponse } from 'next/server'
import { fixBrokenCitationsInDatabase, verifyBrokenCitationsFixed } from '@/lib/services/article-generation/citation-cleanup'

export async function POST(request: NextRequest) {
  try {
    // Fix broken citations
    const result = await fixBrokenCitationsInDatabase()

    // Verify fixes
    const stillBroken = await verifyBrokenCitationsFixed()

    return NextResponse.json({
      success: true,
      message: 'Citation cleanup completed',
      result: {
        ...result,
        stillBrokenAfterFix: stillBroken,
        fixSuccessful: stillBroken === 0,
      },
    })
  } catch (error) {
    console.error('Error in fix-broken-citations endpoint:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Just verify current state
    const stillBroken = await verifyBrokenCitationsFixed()

    return NextResponse.json({
      success: true,
      brokenCitationsCount: stillBroken,
      message: stillBroken === 0 ? 'All citations are fixed!' : `${stillBroken} broken citations found`,
    })
  } catch (error) {
    console.error('Error checking broken citations:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
