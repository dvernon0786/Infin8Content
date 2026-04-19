import { NextRequest } from 'next/server'
import { GET_snapshots } from '@/lib/services/llm-visibility/route-handlers'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return GET_snapshots(req, params.id)
}
