import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Logout API route
 * Signs out the current user and clears their session
 */
export async function POST() {
  try {
    const supabase = await createClient()
    
    // Sign out the user (clears session and cookies)
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error)
      return NextResponse.json(
        { error: 'Failed to sign out' },
        { status: 500 }
      )
    }

    // Return success response
    // The client will handle redirecting to login page
    return NextResponse.json({
      success: true,
      message: 'Signed out successfully'
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

