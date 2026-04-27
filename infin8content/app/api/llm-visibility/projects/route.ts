import { NextRequest } from 'next/server'
import { GET_projects, POST_projects } from '@/lib/services/llm-visibility/route-handlers'

export async function GET(req: NextRequest) {
  return GET_projects(req)
}

export async function POST(req: NextRequest) {
  return POST_projects(req)
}
