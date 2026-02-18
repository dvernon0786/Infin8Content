import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workflow_id: string }> }
) {
  try {
    const { workflow_id } = await params
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('intent_workflows')
      .select('*')
      .eq('id', workflow_id)
      .single()

    if (error) {
      console.error('Workflow fetch error:', error)
      return NextResponse.json(
        { error: 'Workflow not found', details: error.message },
        { status: 404 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ workflow: data })
  } catch (err: any) {
    console.error('Workflow route error:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    )
  }
}
