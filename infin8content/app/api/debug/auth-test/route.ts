import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated', user: null },
        { status: 401 }
      )
    }

    return NextResponse.json({
      message: 'Authenticated',
      user: {
        id: currentUser.id,
        email: currentUser.email,
        org_id: currentUser.org_id,
      }
    })
  } catch (error) {
    console.error('Auth test error:', error)
    return NextResponse.json(
      { error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
