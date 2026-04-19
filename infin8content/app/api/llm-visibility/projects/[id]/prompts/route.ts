import { NextRequest } from 'next/server'
import { GET_prompts, POST_prompts } from '@/lib/services/llm-visibility/route-handlers'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return GET_prompts(req, params.id)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return POST_prompts(req, params.id)
}
