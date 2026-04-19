import { NextRequest } from 'next/server'
import { POST_suggestPrompts } from '@/lib/services/llm-visibility/route-handlers'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return POST_suggestPrompts(req, params.id)
}
