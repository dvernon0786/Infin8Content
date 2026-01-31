import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'
import { validateAndNormalizeUrl, extractDomain } from '@/lib/utils/url-validation'
import { z } from 'zod'
import { NextResponse } from 'next/server'

/**
 * Zod schema for competitor update request validation
 * Validates and sanitizes user input before processing
 */
const updateCompetitorSchema = z.object({
  url: z.string()
    .min(1, 'URL is required')
    .max(500, 'URL must be less than 500 characters')
    .url('Invalid URL format')
    .optional(),
  name: z.string()
    .min(1, 'Competitor name is required')
    .max(100, 'Competitor name must be less than 100 characters')
    .trim()
    .optional(),
  is_active: z.boolean().optional()
})

/**
 * PUT /api/organizations/[orgId]/competitors/[competitorId]
 * 
 * Updates an existing competitor URL for an organization.
 * Validates URL format if provided, checks for duplicates, and updates with proper organization isolation.
 * 
 * @param request - HTTP request containing competitor updates
 * @param params - Route parameters containing organization ID and competitor ID
 * @returns JSON response with updated competitor details, or error details
 * 
 * Request Body (optional fields):
 * - url: string (valid URL format)
 * - name: string (max 100 characters)
 * - is_active: boolean
 * 
 * Response (Success - 200):
 * - id: string (UUID)
 * - organization_id: string (UUID)
 * - url: string (normalized HTTPS URL)
 * - domain: string (extracted domain)
 * - name: string (optional)
 * - is_active: boolean
 * - created_at: string (ISO timestamp)
 * - updated_at: string (ISO timestamp)
 * 
 * Response (Error):
 * - 401: Authentication required
 * - 403: Insufficient permissions
 * - 400: Validation error
 * - 404: Competitor not found
 * - 409: Duplicate competitor domain
 * - 500: Server error
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ orgId: string; competitorId: string }> }
) {
  try {
    // Await params since Next.js 16.1.1 wraps them in Promise
    const { orgId, competitorId } = await params
    
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
    const validationResult = updateCompetitorSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const updates = validationResult.data
    let normalizedUrl: string | null | undefined
    let domain: string | undefined

    // Validate and normalize URL if provided
    if (updates.url) {
      normalizedUrl = validateAndNormalizeUrl(updates.url)
      if (!normalizedUrl) {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        )
      }
      domain = extractDomain(normalizedUrl)
    }

    const supabase = await createClient()

    // Check if competitor exists and belongs to the organization
    const { data: existingCompetitor, error: fetchError } = await supabase
      .from('organization_competitors')
      .select('id, domain, organization_id')
      .eq('id', competitorId)
      .eq('organization_id', targetOrgId)
      .single()

    if (fetchError || !existingCompetitor) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      )
    }

    // Check for domain conflicts if URL is being updated
    const existingDomain = (existingCompetitor as any).domain
    if (normalizedUrl && domain !== existingDomain) {
      const { data: domainConflict, error: checkError } = await supabase
        .from('organization_competitors')
        .select('id')
        .eq('organization_id', targetOrgId)
        .eq('domain', domain)
        .neq('id', competitorId) // Exclude current competitor
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
        return NextResponse.json(
          { error: 'Database error checking domain conflict' },
          { status: 500 }
        )
      }

      if (domainConflict) {
        return NextResponse.json(
          { error: 'Competitor with this domain already exists' },
          { status: 409 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (normalizedUrl !== undefined) {
      updateData.url = normalizedUrl
      updateData.domain = domain
    }
    if (updates.name !== undefined) {
      updateData.name = updates.name
    }
    if (updates.is_active !== undefined) {
      updateData.is_active = updates.is_active
    }

    // Update competitor
    const { data: competitor, error: updateError } = await supabase
      .from('organization_competitors')
      .update(updateData)
      .eq('id', competitorId)
      .eq('organization_id', targetOrgId)
      .select()
      .single()

    if (updateError || !competitor) {
      console.error('Error updating competitor:', updateError)
      return NextResponse.json(
        { error: 'Failed to update competitor' },
        { status: 500 }
      )
    }

    // Log the competitor update action
    try {
      await logActionAsync({
        orgId: targetOrgId,
        userId: currentUser.id,
        action: AuditAction.COMPETITOR_UPDATED,
        details: {
          competitor_id: competitorId,
          updated_fields: Object.keys(updateData),
          domain: (competitor as any).domain,
          has_name: !!(competitor as any).name
        },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('Failed to log competitor update:', logError)
    }

    return NextResponse.json(competitor, { status: 200 })

  } catch (error) {
    console.error('Unexpected error in PUT /api/organizations/[orgId]/competitors/[competitorId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/organizations/[orgId]/competitors/[competitorId]
 * 
 * Deletes a competitor URL from an organization.
 * 
 * @param request - HTTP request
 * @param params - Route parameters containing organization ID and competitor ID
 * @returns JSON response confirming deletion, or error details
 * 
 * Response (Success - 200):
 * - message: string confirming deletion
 * 
 * Response (Error):
 * - 401: Authentication required
 * - 403: Insufficient permissions
 * - 404: Competitor not found
 * - 500: Server error
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ orgId: string; competitorId: string }> }
) {
  try {
    // Await params since Next.js 16.1.1 wraps them in Promise
    const { orgId, competitorId } = await params
    
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

    const supabase = await createClient()

    // Get competitor details before deletion for logging
    const { data: existingCompetitor, error: fetchError } = await supabase
      .from('organization_competitors')
      .select('id, domain, name')
      .eq('id', competitorId)
      .eq('organization_id', targetOrgId)
      .single()

    if (fetchError || !existingCompetitor) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      )
    }

    // Delete competitor
    const { error: deleteError } = await supabase
      .from('organization_competitors')
      .delete()
      .eq('id', competitorId)
      .eq('organization_id', targetOrgId)

    if (deleteError) {
      console.error('Error deleting competitor:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete competitor' },
        { status: 500 }
      )
    }

    // Log the competitor deletion action
    try {
      await logActionAsync({
        orgId: targetOrgId,
        userId: currentUser.id,
        action: AuditAction.COMPETITOR_DELETED,
        details: {
          competitor_id: competitorId,
          domain: (existingCompetitor as any).domain,
          had_name: !!(existingCompetitor as any).name
        },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('Failed to log competitor deletion:', logError)
    }

    return NextResponse.json(
      { message: 'Competitor deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Unexpected error in DELETE /api/organizations/[orgId]/competitors/[competitorId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
