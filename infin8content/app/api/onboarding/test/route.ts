import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log('[Test Route] POST request received')
  
  try {
    const body = await request.json()
    console.log('[Test Route] Body:', body)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test route working',
      received: body 
    })
  } catch (error: any) {
    console.error('[Test Route] Error:', error)
    return NextResponse.json(
      { error: 'Test route error', details: error.message },
      { status: 500 }
    )
  }
}
