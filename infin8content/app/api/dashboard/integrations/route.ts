import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/supabase/get-current-user"

/**
 * GET /api/dashboard/integrations
 * 
 * Retrieves current connected CMS integrations.
 * Returns public metadata only (no passwords).
 */
export async function GET() {
    try {
        const user = await getCurrentUser()
        if (!user?.org_id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const supabase = await createClient()
        const { data: org, error } = await supabase
            .from('organizations')
            .select('blog_config')
            .eq('id', user.org_id)
            .single() as any

        if (error) throw error

        const integrations = org?.blog_config?.integrations || {}

        // Scrub sensitive data before returning to frontend
        const sanitizedIntegrations = Object.entries(integrations).reduce((acc: any, [key, value]: [string, any]) => {
            acc[key] = {
                url: value.url,
                username: value.username,
                connected_at: value.connected_at,
                last_validated_at: value.last_validated_at,
                site_name: value.site_name,
                user_name: value.user_name
            }
            return acc
        }, {})

        return NextResponse.json({ integrations: sanitizedIntegrations })
    } catch (err: any) {
        console.error('[Dashboard Integrations GET] Error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

/**
 * DELETE /api/dashboard/integrations?type=wordpress
 * 
 * Disconnects a specific integration type.
 */
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type')

        if (!type) {
            return NextResponse.json({ error: "Integration type is required" }, { status: 400 })
        }

        const user = await getCurrentUser()
        if (!user?.org_id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const supabase = await createClient()

        // Get current config
        const { data: org } = await supabase
            .from('organizations')
            .select('blog_config')
            .eq('id', user.org_id)
            .single() as any

        const integrations = { ...(org?.blog_config?.integrations || {}) }

        if (!integrations[type]) {
            return NextResponse.json({ error: "Integration not found" }, { status: 404 })
        }

        // Remove the integration
        delete integrations[type]

        // Sync the helper field used for onboarding validation
        // We pick the first remaining integration if available
        const remainingTypes = Object.keys(integrations)
        let integrationHelper = null

        if (remainingTypes.length > 0) {
            const firstType = remainingTypes[0]
            const data = integrations[firstType]
            integrationHelper = {
                type: firstType,
                site_url: data.url,
                username: data.username,
                application_password: data.application_password
            }
        }

        // Update DB
        const { error: updateError } = await supabase
            .from('organizations')
            .update({
                blog_config: {
                    ...(org?.blog_config || {}),
                    integrations
                },
                integration: integrationHelper,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.org_id)

        if (updateError) throw updateError

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('[Dashboard Integrations DELETE] Error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
