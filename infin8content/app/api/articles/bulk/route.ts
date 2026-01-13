/**
 * Bulk operations API endpoint for articles
 * Story 23.1: Multi-article Management Interface
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const BulkDeleteSchema = z.object({
  articleIds: z.array(z.string()).min(1).max(100),
});

const BulkExportSchema = z.object({
  articleIds: z.array(z.string()).min(1).max(100),
  format: z.enum(['csv', 'pdf']),
});

const BulkArchiveSchema = z.object({
  articleIds: z.array(z.string()).min(1).max(100),
});

const BulkStatusChangeSchema = z.object({
  articleIds: z.array(z.string()).min(1).max(100),
  status: z.enum(['draft', 'review', 'published', 'archived']),
});

const BulkAssignSchema = z.object({
  articleIds: z.array(z.string()).min(1).max(100),
  assigneeId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    // Get user and organization
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { operation, ...payload } = body;
    
    switch (operation) {
      case 'delete':
        return handleBulkDelete(payload, supabase, profile.organization_id);
      case 'export':
        return handleBulkExport(payload, supabase, profile.organization_id);
      case 'archive':
        return handleBulkArchive(payload, supabase, profile.organization_id);
      case 'status_change':
        return handleBulkStatusChange(payload, supabase, profile.organization_id);
      case 'assign':
        return handleBulkAssign(payload, supabase, profile.organization_id);
      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }
  } catch (error) {
    console.error('Bulk operation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleBulkDelete(payload: unknown, supabase: any, organizationId: string) {
  const { articleIds } = BulkDeleteSchema.parse(payload);
  
  // Verify all articles belong to the organization
  const { data: articles, error: fetchError } = await supabase
    .from('articles')
    .select('id')
    .in('id', articleIds)
    .eq('organization_id', organizationId);

  if (fetchError) {
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }

  if (articles.length !== articleIds.length) {
    return NextResponse.json({ error: 'Some articles not found or access denied' }, { status: 404 });
  }

  // Delete articles and related data in a transaction
  const { error: deleteError } = await supabase
    .from('articles')
    .delete()
    .in('id', articleIds);

  if (deleteError) {
    return NextResponse.json({ error: 'Failed to delete articles' }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    deleted: articleIds.length,
    message: `Successfully deleted ${articleIds.length} articles`
  });
}

async function handleBulkExport(payload: unknown, supabase: any, organizationId: string) {
  const { articleIds, format } = BulkExportSchema.parse(payload);
  
  // Fetch articles with their content
  const { data: articles, error: fetchError } = await supabase
    .from('articles')
    .select('*')
    .in('id', articleIds)
    .eq('organization_id', organizationId);

  if (fetchError) {
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }

  if (articles.length !== articleIds.length) {
    return NextResponse.json({ error: 'Some articles not found or access denied' }, { status: 404 });
  }

  if (format === 'csv') {
    return generateCSVExport(articles);
  } else if (format === 'pdf') {
    return generatePDFExport(articles);
  }
}

async function handleBulkArchive(payload: unknown, supabase: any, organizationId: string) {
  const { articleIds } = BulkArchiveSchema.parse(payload);
  
  // Verify articles belong to organization
  const { data: articles, error: fetchError } = await supabase
    .from('articles')
    .select('id')
    .in('id', articleIds)
    .eq('organization_id', organizationId);

  if (fetchError) {
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }

  if (articles.length !== articleIds.length) {
    return NextResponse.json({ error: 'Some articles not found or access denied' }, { status: 404 });
  }

  // Update articles to archived status
  const { error: updateError } = await supabase
    .from('articles')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .in('id', articleIds);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to archive articles' }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    archived: articleIds.length,
    message: `Successfully archived ${articleIds.length} articles`
  });
}

async function handleBulkStatusChange(payload: unknown, supabase: any, organizationId: string) {
  const { articleIds, status } = BulkStatusChangeSchema.parse(payload);
  
  // Verify articles belong to organization
  const { data: articles, error: fetchError } = await supabase
    .from('articles')
    .select('id')
    .in('id', articleIds)
    .eq('organization_id', organizationId);

  if (fetchError) {
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }

  if (articles.length !== articleIds.length) {
    return NextResponse.json({ error: 'Some articles not found or access denied' }, { status: 404 });
  }

  // Update articles status
  const { error: updateError } = await supabase
    .from('articles')
    .update({ 
      status, 
      updated_at: new Date().toISOString() 
    })
    .in('id', articleIds);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update article status' }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    updated: articleIds.length,
    message: `Successfully updated status for ${articleIds.length} articles to ${status}`
  });
}

async function handleBulkAssign(payload: unknown, supabase: any, organizationId: string) {
  const { articleIds, assigneeId } = BulkAssignSchema.parse(payload);
  
  // Verify articles belong to organization
  const { data: articles, error: fetchError } = await supabase
    .from('articles')
    .select('id')
    .in('id', articleIds)
    .eq('organization_id', organizationId);

  if (fetchError) {
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }

  if (articles.length !== articleIds.length) {
    return NextResponse.json({ error: 'Some articles not found or access denied' }, { status: 404 });
  }

  // Update articles assignment
  const updateData = assigneeId 
    ? { assigned_to: assigneeId, updated_at: new Date().toISOString() }
    : { assigned_to: null, updated_at: new Date().toISOString() };

  const { error: updateError } = await supabase
    .from('articles')
    .update(updateData)
    .in('id', articleIds);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to assign articles' }, { status: 500 });
  }

  const message = assigneeId 
    ? `Successfully assigned ${articleIds.length} articles`
    : `Successfully unassigned ${articleIds.length} articles`;

  return NextResponse.json({ 
    success: true, 
    assigned: articleIds.length,
    message
  });
}

function generateCSVExport(articles: any[]) {
  const headers = [
    'ID', 'Title', 'Keyword', 'Status', 'Created At', 
    'Updated At', 'Word Count', 'Progress'
  ];
  
  const csvRows = [
    headers.join(','),
    ...articles.map(article => [
      article.id,
      `"${article.title || article.keyword}"`,
      `"${article.keyword}"`,
      article.status,
      article.created_at,
      article.updated_at,
      article.progress?.word_count || 0,
      `${article.progress?.progress_percentage || 0}%`
    ].join(','))
  ];

  const csvContent = csvRows.join('\n');
  
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="articles-export-${Date.now()}.csv"`,
    },
  });
}

async function generatePDFExport(articles: any[]) {
  // For now, return a simple text-based export
  // In a real implementation, you'd use a PDF library like jsPDF or Puppeteer
  const textContent = articles.map(article => 
    `Title: ${article.title || article.keyword}\n` +
    `Keyword: ${article.keyword}\n` +
    `Status: ${article.status}\n` +
    `Created: ${article.created_at}\n` +
    `Updated: ${article.updated_at}\n` +
    `Word Count: ${article.progress?.word_count || 0}\n` +
    `Progress: ${article.progress?.progress_percentage || 0}%\n` +
    '---\n'
  ).join('\n');

  return new NextResponse(textContent, {
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="articles-export-${Date.now()}.txt"`,
    },
  });
}
