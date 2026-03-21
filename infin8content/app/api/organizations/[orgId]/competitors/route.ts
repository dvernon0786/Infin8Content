import { createServiceRoleClient } from '@/lib/supabase/server'
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

const bulkCompetitorsSchema = z.object({
  competitors: z.array(createCompetitorSchema).min(1, 'At least one competitor required')
})

/**
 * POST /api/organizations/[orgId]/competitors
 * 
 * Creates multiple competitor URLs for an organization (atomic operation).
 * Deletes existing competitors, validates URLs, checks for duplicates, and stores all new competitors.
 * 
 * @param request - HTTP request containing competitors array
 * @param params - Route parameters containing organization ID
 * @returns JSON response with competitor details, or error details
 * 
 * Request Body:
 * - competitors: array of { url: string, name?: string }
 * 
 * Response (Success - 200):
 * - competitors: array of created competitor objects
 * 
 * Response (Error):
 * - 401: Authentication required
 * - 403: Insufficient permissions
 * - 400: Validation error
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
    const validationResult = bulkCompetitorsSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { competitors } = validationResult.data
    const supabase = createServiceRoleClient()

    // Atomic operation: delete existing competitors, then insert all new ones
    try {
      // Delete all existing competitors for this organization
      await supabase
        .from('organization_competitors')
        .delete()
        .eq('organization_id', targetOrgId)

      // Process and insert all new competitors
      const processedCompetitors = competitors.map(competitor => {
        const normalizedUrl = validateAndNormalizeUrl(competitor.url)
        if (!normalizedUrl) {
          throw new Error(`Invalid URL format: ${competitor.url}`)
        }
        
        const domain = extractDomain(normalizedUrl)
        
        return {
          organization_id: targetOrgId,
          url: normalizedUrl,
          domain,
          name: competitor.name || competitor.url,
          created_by: currentUser.user.id
        }
      })

      // Insert all competitors
      const { data: insertedCompetitors, error: insertError } = await supabase
        .from('organization_competitors')
        .insert(processedCompetitors)
        .select()

      if (insertError) {
        console.error('Error inserting competitors:', insertError)
        return NextResponse.json(
          { error: 'Failed to create competitors', details: insertError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        competitors: insertedCompetitors
      })

    } catch (error) {
      console.error('Bulk competitor operation failed:', error)
      return NextResponse.json(
        { error: 'Failed to process competitors', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }

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

    const supabase = createServiceRoleClient()

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
