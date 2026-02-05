import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/get-current-user';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { runContentWritingAgent } from '@/lib/services/article-generation/content-writing-agent';

export async function POST(
  request: NextRequest,
  { params }: { params: { article_id: string; section_id: string } }
) {
  const startTime = Date.now();

  try {
    // Authentication
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const { article_id, section_id } = params;

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

    if (sectionError || !section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Validate section status
    if (section.status !== 'researched') {
      return NextResponse.json({ 
        error: 'Section must be researched before writing',
        current_status: section.status 
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
      .lt('section_order', section.section_order)
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
        sectionHeader: section.section_header,
        sectionType: section.section_type,
        researchPayload: section.research_payload || {},
        priorSections: priorSections || [],
        organizationDefaults: org?.content_defaults || {
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
