import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log('[Minimal Persist] POST request received')
  
  try {
    const body = await request.json()
    console.log('[Minimal Persist] Body:', body)
    
    // Just return success for now
    return NextResponse.json({ 
      success: true, 
      message: 'Minimal persist working',
      received: body 
    })
  } catch (error: any) {
    console.error('[Minimal Persist] Error:', error)
    return NextResponse.json(
      { error: 'Minimal persist error', details: error.message },
      { status: 500 }
    )
  }
}
