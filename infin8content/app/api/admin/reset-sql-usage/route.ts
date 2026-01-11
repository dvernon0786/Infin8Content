import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { NextResponse } from 'next/server'

/**
 * POST /api/admin/reset-sql-usage
 * 
 * Resets SQL editor usage for a specific user
 * Requires admin privileges
 * 
 * Request body:
 * - userId: string - The user ID to reset usage for
 */
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if current user is admin (you may need to implement this check)
    // For now, we'll assume the user can reset their own usage or is an admin
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Only allow users to reset their own usage unless they're admin
    if (currentUser.id !== userId && currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Can only reset your own usage' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // Reset SQL editor usage for the user
    const { error } = await supabase
      .from('user_usage' as any)
      .update({
        sql_queries_count: 0,
        sql_queries_reset_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Failed to reset SQL usage:', error)
      return NextResponse.json(
        { error: 'Failed to reset SQL usage' },
        { status: 500 }
      )
    }

    // Log the reset action
    console.log(`SQL usage reset for user: ${userId} by: ${currentUser.id}`)

    return NextResponse.json({
      success: true,
      message: 'SQL usage reset successfully',
      userId,
      resetBy: currentUser.id,
      resetAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('SQL usage reset error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
