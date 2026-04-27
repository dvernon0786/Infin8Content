import { NextRequest } from 'next/server'
import { POST_rerun } from '@/lib/services/llm-visibility/route-handlers'

export async function POST(req: NextRequest, context: any) {
  const params = await context.params
  return POST_rerun(req, params?.id)
}
