import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/get-current-user';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { runContentWritingAgent } from '@/lib/services/article-generation/content-writing-agent';

// Helper functions for audit logging
function extractIpAddress(headers: Headers): string {
  return headers.get('x-forwarded-for') || 
         headers.get('x-real-ip') || 
         'unknown';
}

function extractUserAgent(headers: Headers): string {
  return headers.get('user-agent') || 'unknown';
}

async function logActionAsync(data: {
  orgId: string;
  userId: string;
  action: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}): Promise<void> {
  try {
    const supabase = createServiceRoleClient();
    await supabase.from('audit_logs').insert({
      organization_id: data.orgId,
      user_id: data.userId,
      action: data.action,
      details: data.details,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log audit action:', error);
    // Don't throw - audit logging should never block the main flow
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ article_id: string; section_id: string }> }
) {
  const startTime = Date.now();
  const { article_id, section_id } = await params;

  try {
    // Authentication
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // Log audit event - content generation started
    await logActionAsync({
      orgId: currentUser.org_id,
      userId: currentUser.id,
      action: 'article.section.content_generation.started',
      details: { section_id, article_id },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    });

    // Load section with organization validation
    const { data: section, error: sectionError } = await supabase
      .from('article_sections')
      .select(`
        *,
        articles(organization_id)
      `)
      .eq('id', section_id)
      .eq('articles.organization_id', currentUser.org_id)
      .single();

    // Validate section status
    if (sectionError || !section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    if ((section as any).status !== 'researched') {
      return NextResponse.json({ 
        error: 'Section must be researched before writing',
        current_status: (section as any).status 
      }, { status: 400 });
    }

    // Update status to writing
    await supabase
      .from('article_sections')
      .update({ 
        status: 'writing',
        updated_at: new Date().toISOString()
      })
      .eq('id', section_id);

    // Load prior sections for context
    const { data: priorSections } = await supabase
      .from('article_sections')
      .select('*')
      .eq('article_id', article_id)
      .eq('status', 'completed')
      .lt('section_order', (section as any).section_order)
      .order('section_order');

    // Load organization defaults
    const { data: org } = await supabase
      .from('organizations')
      .select('content_defaults')
      .eq('id', currentUser.org_id)
      .single();

    // Run Content Writing Agent (retries handled in service layer)
    let result;
    try {
      result = await runContentWritingAgent({
        sectionHeader: (section as any).section_header,
        sectionType: (section as any).section_type,
        researchPayload: (section as any).research_payload || {},
        priorSections: (priorSections as any) || [],
        organizationDefaults: (org as any)?.content_defaults || {
          tone: 'professional',
          language: 'en',
          internal_links: false,
          global_instructions: ''
        }
      });
    } catch (error) {
      // Service layer already retried; persist failure
      await supabase
        .from('article_sections')
        .update({ 
          status: 'failed',
          error_details: { message: (error as Error)?.message, attempts: 3 },
          updated_at: new Date().toISOString()
        })
        .eq('id', section_id);
      
      throw error;
    }

    // Update section with generated content
    await supabase
      .from('article_sections')
      .update({
        content_markdown: result.markdown,
        content_html: result.html,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', section_id);

    const duration = Date.now() - startTime;
    console.log(`Content writing API completed in ${duration}ms`);

    // Log audit event - content generation completed
    await logActionAsync({
      orgId: currentUser.org_id,
      userId: currentUser.id,
      action: 'article.section.content_generation.completed',
      details: { 
        section_id, 
        article_id, 
        word_count: result.wordCount,
        duration_ms: duration
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    });

    return NextResponse.json({
      success: true,
      data: {
        section_id,
        status: 'completed',
        markdown: result.markdown,
        html: result.html,
        word_count: result.wordCount
      }
    });

  } catch (error) {
    console.error('Content writing error:', error);
    return NextResponse.json({
      error: 'Content writing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
