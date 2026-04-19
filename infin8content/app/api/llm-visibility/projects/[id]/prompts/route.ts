import { NextRequest } from 'next/server'
import { GET_prompts, POST_prompts } from '@/lib/services/llm-visibility/route-handlers'

export async function GET(req: NextRequest, context: any) {
  const params = await context.params
  return GET_prompts(req, params?.id)
}

export async function POST(req: NextRequest, context: any) {
  const params = await context.params
  return POST_prompts(req, params?.id)
}
