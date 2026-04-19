import { NextRequest } from 'next/server'
import { GET_snapshots } from '@/lib/services/llm-visibility/route-handlers'

export async function GET(req: NextRequest, context: any) {
  const params = await context.params
  return GET_snapshots(req, params?.id)
}
