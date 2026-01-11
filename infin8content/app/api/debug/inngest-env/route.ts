import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const eventKey = process.env.INNGEST_EVENT_KEY
  const signingKey = process.env.INNGEST_SIGNING_KEY
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return NextResponse.json({
    environment: {
      isDevelopment,
      hasEventKey: !!eventKey,
      hasSigningKey: !!signingKey,
      eventKeyPrefix: eventKey ? eventKey.substring(0, 8) + '...' : null,
      signingKeyPrefix: signingKey ? signingKey.substring(0, 8) + '...' : null,
      nodeEnv: process.env.NODE_ENV,
    }
  })
}
