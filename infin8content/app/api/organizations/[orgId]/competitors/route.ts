import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'
import { validateAndNormalizeUrl, extractDomain } from '@/lib/utils/url-validation'
import { z } from 'zod'
import { NextResponse } from 'next/server'

/**
 * Zod schema for competitor creation request validation
 * Validates and sanitizes user input before processing
 */
const createCompetitorSchema = z.object({
  url: z.string()
    .min(1, 'URL is required')
    .max(500, 'URL must be less than 500 characters')
    .url('Invalid URL format'),
  name: z.string()
    .min(1, 'Competitor name is required')
    .max(100, 'Competitor name must be less than 100 characters')
    .trim()
    .optional()
})

/**
 * POST /api/organizations/[orgId]/competitors
 * 
 * Creates a new competitor URL for an organization.
 * Validates URL format, checks for duplicates, and stores with proper organization isolation.
 * 
 * @param request - HTTP request containing competitor URL and optional name
 * @param params - Route parameters containing organization ID
 * @returns JSON response with competitor details, or error details
 * 
 * Request Body:
 * - url: string (required, valid URL format)
 * - name: string (optional, max 100 characters)
 * 
 * Response (Success - 200):
 * - id: string (UUID)
 * - organization_id: string (UUID)
 * - url: string (normalized HTTPS URL)
 * - domain: string (extracted domain)
 * - name: string (optional)
 * - is_active: boolean
 * - created_at: string (ISO timestamp)
 * 
 * Response (Error):
 * - 401: Authentication required
 * - 403: Insufficient permissions
 * - 400: Validation error
 * - 409: Duplicate competitor domain
 * - 500: Server error
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    // Await params since Next.js 16.1.1 wraps them in Promise
    const { orgId } = await params
    
    // Get current authenticated user
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has admin role in their organization
    if (currentUser.role !== 'owner' && currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin role required.' },
        { status: 403 }
      )
    }

    // Verify user belongs to the target organization
    const targetOrgId = orgId
    if (targetOrgId !== currentUser.org_id) {
      return NextResponse.json(
        { error: 'Cannot configure competitors for other organizations' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = createCompetitorSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { url, name } = validationResult.data

    // Validate and normalize URL
    const normalizedUrl = validateAndNormalizeUrl(url)
    if (!normalizedUrl) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Extract domain
    const domain = extractDomain(normalizedUrl)

    const supabase = await createClient()

    // Check for existing competitor with same domain
    const { data: existingCompetitor, error: checkError } = await supabase
      .from('organization_competitors')
      .select('id')
      .eq('organization_id', targetOrgId)
      .eq('domain', domain)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
      return NextResponse.json(
        { error: 'Database error checking existing competitor' },
        { status: 500 }
      )
    }

    if (existingCompetitor) {
      return NextResponse.json(
        { error: 'Competitor already exists' },
        { status: 409 }
      )
    }

    // Create new competitor
    const { data: competitor, error: insertError } = await supabase
      .from('organization_competitors')
      .insert({
        organization_id: targetOrgId,
        url: normalizedUrl,
        domain,
        name,
        created_by: currentUser.id
      })
      .select()
      .single()

    if (insertError || !competitor) {
      console.error('Error creating competitor:', insertError)
      return NextResponse.json(
        { error: 'Failed to create competitor' },
        { status: 500 }
      )
    }

    // Log the competitor creation action
    try {
      await logActionAsync({
        orgId: targetOrgId,
        userId: currentUser.id,
        action: AuditAction.COMPETITOR_CREATED,
        details: {
          competitor_id: (competitor as any).id,
          domain: (competitor as any).domain,
          has_name: !!(competitor as any).name
        },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('Failed to log competitor creation:', logError)
    }

    return NextResponse.json(competitor, { status: 200 })

  } catch (error) {
    console.error('Unexpected error in POST /api/organizations/[orgId]/competitors:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/organizations/[orgId]/competitors
 * 
 * Retrieves all competitor URLs for the specified organization.
 * 
 * @param request - HTTP request
 * @param params - Route parameters containing organization ID
 * @returns JSON response with competitor list, or error details
 * 
 * Response (Success - 200):
 * - Array of competitor objects with id, url, domain, name, is_active, created_at
 * 
 * Response (Error):
 * - 401: Authentication required
 * - 403: Insufficient permissions
 * - 500: Server error
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    // Await params since Next.js 16.1.1 wraps them in Promise
    const { orgId } = await params

    // Get current authenticated user
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify user belongs to the target organization
    const targetOrgId = orgId
    if (targetOrgId !== currentUser.org_id) {
      return NextResponse.json(
        { error: 'Cannot access competitors for other organizations' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // Get all competitors for the organization
    const { data: competitors, error } = await supabase
      .from('organization_competitors')
      .select(`
        id,
        url,
        domain,
        name,
        is_active,
        created_at,
        updated_at
      `)
      .eq('organization_id', targetOrgId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching competitors:', error)
      return NextResponse.json(
        { error: 'Failed to fetch competitors' },
        { status: 500 }
      )
    }

    // Log the competitor list view action
    try {
      await logActionAsync({
        orgId: currentUser.org_id,
        userId: currentUser.id,
        action: AuditAction.COMPETITORS_VIEWED,
        details: {
          competitor_count: competitors?.length || 0
        },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('Failed to log competitor view:', logError)
    }

    return NextResponse.json(competitors || [])

  } catch (error) {
    console.error('Unexpected error in GET /api/organizations/[orgId]/competitors:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
