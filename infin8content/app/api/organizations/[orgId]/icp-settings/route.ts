import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'
import { encryptICPFields, decryptICPFields } from '@/lib/utils/encryption'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import type { 
  CreateICPSettingsRequest, 
  CreateICPSettingsResponse,
  UpdateICPSettingsRequest,
  ICPSettings
} from '@/types/icp'

/**
 * Zod schema for ICP settings creation request validation
 * Validates and sanitizes user input before processing
 */
const createICPSchema = z.object({
  target_industries: z.array(z.string().min(1).max(50))
    .min(1, 'At least one target industry is required')
    .max(10, 'Maximum 10 target industries allowed'),
  buyer_roles: z.array(z.string().min(1).max(50))
    .min(1, 'At least one buyer role is required')
    .max(10, 'Maximum 10 buyer roles allowed'),
  pain_points: z.array(z.string().min(1).max(200))
    .min(1, 'At least one pain point is required')
    .max(20, 'Maximum 20 pain points allowed'),
  value_proposition: z.string()
    .min(10, 'Value proposition must be at least 10 characters')
    .max(500, 'Value proposition must be less than 500 characters')
    .trim()
})

/**
 * Zod schema for ICP settings update request validation
 */
const updateICPSchema = z.object({
  target_industries: z.array(z.string().min(1).max(50))
    .min(1, 'At least one target industry is required')
    .max(10, 'Maximum 10 target industries allowed')
    .optional(),
  buyer_roles: z.array(z.string().min(1).max(50))
    .min(1, 'At least one buyer role is required')
    .max(10, 'Maximum 10 buyer roles allowed')
    .optional(),
  pain_points: z.array(z.string().min(1).max(200))
    .min(1, 'At least one pain point is required')
    .max(20, 'Maximum 20 pain points allowed')
    .optional(),
  value_proposition: z.string()
    .min(10, 'Value proposition must be at least 10 characters')
    .max(500, 'Value proposition must be less than 500 characters')
    .trim()
    .optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
)

/**
 * PUT /api/organizations/[orgId]/icp-settings
 * 
 * Creates or updates ICP configuration for an organization.
 * Enforces one ICP configuration per organization with real encryption.
 * 
 * @param request - HTTP request containing ICP configuration parameters
 * @param params - Route parameters containing organization ID
 * @returns JSON response with ICP settings details, or error details
 * 
 * Request Body:
 * - target_industries: string[] (required, 1-10 items, max 50 chars each)
 * - buyer_roles: string[] (required, 1-10 items, max 50 chars each)
 * - pain_points: string[] (required, 1-20 items, max 200 chars each)
 * - value_proposition: string (required, 10-500 chars)
 * 
 * Response (Success - 200):
 * - id: string (UUID)
 * - organization_id: string (UUID)
 * - target_industries: string[]
 * - buyer_roles: string[]
 * - pain_points: string[]
 * - value_proposition: string
 * - created_at: string (ISO timestamp)
 * 
 * Response (Error):
 * - 401: Authentication required
 * - 403: Insufficient permissions
 * - 400: Validation error
 * - 500: Server error
 */
export async function PUT(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  try {
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
    const targetOrgId = params.orgId
    if (targetOrgId !== currentUser.org_id) {
      return NextResponse.json(
        { error: 'Cannot configure ICP settings for other organizations' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = createICPSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { target_industries, buyer_roles, pain_points, value_proposition } = validationResult.data

    const supabase = await createClient()

    // Check if ICP settings already exist for this organization
    const { data: existingICP, error: checkError } = await supabase
      .from('icp_settings')
      .select('id, created_at')
      .eq('organization_id', targetOrgId)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
      return NextResponse.json(
        { error: 'Database error checking existing ICP settings' },
        { status: 500 }
      )
    }

    // Encrypt sensitive ICP data
    const encryptedData = await encryptICPFields({
      target_industries,
      buyer_roles,
      pain_points,
      value_proposition
    })

    if (existingICP) {
      // Update existing ICP settings
      const updatePayload = {
        encrypted_data: encryptedData,
        updated_at: new Date().toISOString()
      }

      const { data: updatedICP, error: updateError } = await supabase
        .from('icp_settings')
        .update(updatePayload)
        .select(`
          id,
          organization_id,
          target_industries,
          buyer_roles,
          pain_points,
          value_proposition,
          created_at,
          updated_at,
          encrypted_data
        `)
        .eq('organization_id', targetOrgId)
        .single()

      if (updateError || !updatedICP) {
        console.error('Error updating ICP settings:', updateError)
        return NextResponse.json(
          { error: 'Failed to update ICP settings' },
          { status: 500 }
        )
      }

      // Type assertion to handle Supabase response
      const icpRecord = updatedICP as any
      const decryptedICP = await decryptICPFields(icpRecord.encrypted_data)
      const icp = {
        ...icpRecord,
        ...decryptedICP
      }

      // Log the ICP settings update action
      try {
        await logActionAsync({
          orgId: targetOrgId,
          userId: currentUser.id,
          action: AuditAction.ICP_SETTINGS_UPDATED,
          details: {
            icp_settings_id: icp.id,
            target_industries_count: icp.target_industries.length,
            buyer_roles_count: icp.buyer_roles.length,
            pain_points_count: icp.pain_points.length,
            has_value_proposition: icp.value_proposition.length > 0
          },
          ipAddress: extractIpAddress(request.headers),
          userAgent: extractUserAgent(request.headers),
        })
      } catch (logError) {
        // Don't fail the request if logging fails
        console.error('Failed to log ICP settings update:', logError)
      }

      // Return success response
      const response: CreateICPSettingsResponse = {
        id: icp.id,
        organization_id: icp.organization_id,
        target_industries: icp.target_industries,
        buyer_roles: icp.buyer_roles,
        pain_points: icp.pain_points,
        value_proposition: icp.value_proposition,
        created_at: icp.created_at
      }

      return NextResponse.json(response, { status: 200 })

    } else {
      // Create new ICP settings
      const insertPayload = {
        organization_id: targetOrgId,
        target_industries, // Keep for querying
        created_by: currentUser.id,
        encrypted_data: encryptedData
      }

      const { data: icpData, error: insertError } = await supabase
        .from('icp_settings')
        .insert(insertPayload)
        .select(`
          id,
          organization_id,
          target_industries,
          buyer_roles,
          pain_points,
          value_proposition,
          created_at,
          updated_at,
          encrypted_data
        `)
        .single()

      if (insertError || !icpData) {
        console.error('Error creating ICP settings:', insertError)
        return NextResponse.json(
          { error: 'Failed to create ICP settings' },
          { status: 500 }
        )
      }

      // Type assertion to handle Supabase response
      const icpRecord = icpData as any
      const decryptedICP = await decryptICPFields(icpRecord.encrypted_data)
      const icp = {
        ...icpRecord,
        ...decryptedICP
      }

      // Log the ICP settings creation action
      try {
        await logActionAsync({
          orgId: targetOrgId,
          userId: currentUser.id,
          action: AuditAction.ICP_SETTINGS_CREATED,
          details: {
            icp_settings_id: icp.id,
            target_industries_count: icp.target_industries.length,
            buyer_roles_count: icp.buyer_roles.length,
            pain_points_count: icp.pain_points.length,
            has_value_proposition: icp.value_proposition.length > 0
          },
          ipAddress: extractIpAddress(request.headers),
          userAgent: extractUserAgent(request.headers),
        })
      } catch (logError) {
        // Don't fail the request if logging fails
        console.error('Failed to log ICP settings creation:', logError)
      }

      // Return success response
      const response: CreateICPSettingsResponse = {
        id: icp.id,
        organization_id: icp.organization_id,
        target_industries: icp.target_industries,
        buyer_roles: icp.buyer_roles,
        pain_points: icp.pain_points,
        value_proposition: icp.value_proposition,
        created_at: icp.created_at
      }

      return NextResponse.json(response, { status: 200 })
    }

  } catch (error) {
    console.error('Unexpected error in PUT /api/organizations/[orgId]/icp-settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/organizations/[orgId]/icp-settings
 * 
 * Retrieves ICP settings for the specified organization.
 * 
 * @param request - HTTP request
 * @param params - Route parameters containing organization ID
 * @returns JSON response with ICP settings, or error details
 * 
 * Response (Success - 200):
 * - id: string (UUID)
 * - organization_id: string (UUID)
 * - target_industries: string[]
 * - buyer_roles: string[]
 * - pain_points: string[]
 * - value_proposition: string
 * - created_at: string (ISO timestamp)
 * - updated_at: string (ISO timestamp)
 * 
 * Response (Error):
 * - 401: Authentication required
 * - 404: ICP settings not found
 * - 500: Server error
 */
export async function GET(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  try {
    // Get current authenticated user
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify user belongs to the target organization
    const targetOrgId = params.orgId
    if (targetOrgId !== currentUser.org_id) {
      return NextResponse.json(
        { error: 'Cannot access ICP settings for other organizations' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // Get ICP settings for the organization
    const { data: icpSettings, error } = await supabase
      .from('icp_settings')
      .select(`
        id,
        organization_id,
        target_industries,
        buyer_roles,
        pain_points,
        value_proposition,
        created_at,
        updated_at,
        encrypted_data
      `)
      .eq('organization_id', targetOrgId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching ICP settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch ICP settings' },
        { status: 500 }
      )
    }

    if (!icpSettings) {
      return NextResponse.json(
        { error: 'ICP settings not found for your organization' },
        { status: 404 }
      )
    }

    // Type assertion to handle Supabase response
    const icpRecord = icpSettings as any
    const decryptedData = await decryptICPFields(icpRecord.encrypted_data)
    const decryptedICP = {
      ...icpRecord,
      ...decryptedData
    }

    // Log the ICP settings view action
    try {
      await logActionAsync({
        orgId: currentUser.org_id,
        userId: currentUser.id,
        action: AuditAction.ICP_SETTINGS_VIEWED,
        details: {
          icp_settings_id: decryptedICP.id
        },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('Failed to log ICP settings view:', logError)
    }

    return NextResponse.json(decryptedICP)

  } catch (error) {
    console.error('Unexpected error in GET /api/organizations/[orgId]/icp-settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
