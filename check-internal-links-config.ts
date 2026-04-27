#!/usr/bin/env ts-node

/**
 * TypeScript script to verify internal links configuration
 *
 * Usage: npx ts-node check-internal-links-config.ts
 *
 * This script checks if a user who completed onboarding has their
 * internal links configuration properly saved in Supabase.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

interface ContentDefaults {
  language?: string;
  tone?: string;
  style?: string;
  target_word_count?: number;
  auto_publish?: boolean;
  brand_color?: string;
  image_style?: string;
  add_youtube_video?: boolean;
  add_cta?: boolean;
  add_infographics?: boolean;
  add_emojis?: boolean;
  internal_links?: boolean;
  num_internal_links?: number;
}

interface Organization {
  id: string;
  name: string;
  content_defaults?: ContentDefaults;
  website_url?: string;
  created_at: string;
  updated_at: string;
}

interface Article {
  id: string;
  title: string;
  slug: string | null;
  status: string;
  word_count: number;
  created_at: string;
}

interface ArticleSection {
  id: string;
  article_id: string;
  section_header: string;
  section_type: string;
  status: string;
  content_html: string | null;
  content_markdown: string | null;
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const userId = 'fe1b0278-f603-46e3-b031-b978545e72e4';
const userEmail = 'damien@flowtic.cloud';
const orgId = 'e40d7133-bfb6-4349-abe9-7583b21ffe6e';

async function checkInternalLinksConfig(): Promise<void> {
  console.log('🔍 Checking Internal Links Configuration\n');
  console.log(`📧 User Email: ${userEmail}`);
  console.log(`👤 User ID: ${userId}`);
  console.log(`🏢 Org ID: ${orgId}\n`);
  console.log('─'.repeat(80));

  try {
    // 1. Check organization settings
    console.log('\n1️⃣  Fetching Organization Settings...\n');
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, content_defaults, website_url, created_at, updated_at')
      .eq('id', orgId)
      .single();

    if (orgError) {
      console.error('❌ Error fetching organization:', orgError.message);
      return;
    }

    if (!orgData) {
      console.error('❌ Organization not found');
      return;
    }

    const org = orgData as Organization;

    console.log('✅ Organization Found:');
    console.log(`   Name: ${org.name}`);
    console.log(`   Created: ${org.created_at}`);
    console.log(`   Updated: ${org.updated_at}`);

    // 2. Extract and display content defaults
    console.log('\n2️⃣  Content Defaults Configuration:\n');
    const contentDefaults = org.content_defaults;

    if (!contentDefaults) {
      console.warn('⚠️  No content_defaults found in organization settings');
    } else {
      console.log('✅ Content Defaults:');
      console.log(`   Language: ${contentDefaults.language || 'not set'}`);
      console.log(`   Tone: ${contentDefaults.tone || 'not set'}`);
      console.log(`   Style: ${contentDefaults.style || 'not set'}`);
      console.log(`   Target Word Count: ${contentDefaults.target_word_count || 'not set'}`);
      console.log(`   Auto Publish: ${contentDefaults.auto_publish ? 'Yes' : 'No'}`);
      console.log(`   Brand Color: ${contentDefaults.brand_color || 'not set'}`);
      console.log(`   Image Style: ${contentDefaults.image_style || 'not set'}`);

      // 🔗 Internal Links Configuration (KEY INFO)
      console.log('\n   🔗 INTERNAL LINKS CONFIGURATION:');
      const internalLinksEnabled = contentDefaults.internal_links;
      const maxLinks = contentDefaults.num_internal_links;

      const enabledStatus = internalLinksEnabled === true
        ? '✅ YES'
        : internalLinksEnabled === false
          ? '❌ NO'
          : '⚠️  NOT SET';

      console.log(`      ├─ Enabled: ${enabledStatus}`);
      console.log(`      └─ Max Links: ${maxLinks !== undefined ? maxLinks : '⚠️  NOT SET'}`);

      // Other toggles
      console.log(`\n   Other Features:`);
      console.log(`   ├─ Add YouTube Videos: ${contentDefaults.add_youtube_video ? '✅' : '❌'}`);
      console.log(`   ├─ Add CTA: ${contentDefaults.add_cta ? '✅' : '❌'}`);
      console.log(`   ├─ Add Infographics: ${contentDefaults.add_infographics ? '✅' : '❌'}`);
      console.log(`   └─ Add Emojis: ${contentDefaults.add_emojis ? '✅' : '❌'}`);
    }

    // 3. Check website info
    console.log('\n3️⃣  Website Information:\n');
    const websiteUrl = org.website_url;

    if (!websiteUrl) {
      console.warn('⚠️  No website URL configured');
    } else {
      console.log(`✅ Website URL: ${websiteUrl}`);
    }

    // 4. Check if articles have been generated
    console.log('\n4️⃣  Generated Articles:\n');
    const { data: articlesData, error: articlesError } = await supabase
      .from('articles')
      .select('id, title, slug, status, word_count, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (articlesError) {
      console.error('❌ Error fetching articles:', articlesError.message);
    } else if (!articlesData || articlesData.length === 0) {
      console.log('ℹ️  No articles generated yet');
    } else {
      const articles = articlesData as Article[];
      console.log(`✅ Found ${articles.length} article(s):`);
      articles.forEach((article, i) => {
        console.log(`\n   ${i + 1}. ${article.title}`);
        console.log(`      Status: ${article.status}`);
        console.log(`      Slug: ${article.slug || 'none'}`);
        console.log(`      Words: ${article.word_count}`);
        console.log(`      Created: ${new Date(article.created_at).toLocaleString()}`);
      });

      // 5. Check sections for internal links
      console.log('\n5️⃣  Article Sections with Link Detection:\n');
      const articleIds = articles.map(a => a.id);

      if (articleIds.length > 0) {
        const { data: sectionsData, error: sectionsError } = await supabase
          .from('article_sections')
          .select('id, article_id, section_header, section_type, status, content_html, content_markdown')
          .in('article_id', articleIds)
          .order('article_id', { ascending: false })
          .order('section_order', { ascending: true });

        if (sectionsError) {
          console.error('❌ Error fetching sections:', sectionsError.message);
        } else if (!sectionsData || sectionsData.length === 0) {
          console.log('ℹ️  No sections found');
        } else {
          const sections = sectionsData as ArticleSection[];
          let linksFoundCount = 0;

          sections.forEach((section) => {
            const hasHtmlLinks = section.content_html?.includes('<a href=') ?? false;
            const hasMarkdownLinks = section.content_markdown?.includes('](') ?? false;

            if (hasHtmlLinks || hasMarkdownLinks) {
              linksFoundCount++;
              console.log(`✅ Section: "${section.section_header}" (${section.section_type})`);
              console.log(`   HTML Links: ${hasHtmlLinks ? '✅ Found' : '❌ None'}`);
              console.log(`   Markdown Links: ${hasMarkdownLinks ? '✅ Found' : '❌ None'}`);
            }
          });

          if (linksFoundCount === 0) {
            console.log('⚠️  No internal links detected in any sections');
          } else {
            console.log(`\n✅ Total sections with links: ${linksFoundCount} of ${sections.length}`);
          }
        }
      }
    }

    // 6. Final Summary
    console.log('\n' + '─'.repeat(80));
    console.log('\n📊 FINAL SUMMARY:\n');

    if (contentDefaults) {
      const internalLinksEnabled = contentDefaults.internal_links === true;
      const maxLinks = contentDefaults.num_internal_links;

      if (internalLinksEnabled) {
        console.log(`✅ Internal linking is ENABLED`);
        console.log(`✅ Max links per article: ${maxLinks}`);
        console.log(`\n✨ Configuration complete - articles will have internal links injected during generation`);
      } else {
        console.log(`❌ Internal linking is DISABLED`);
        console.log(`\nℹ️  User will need to enable this in content settings to activate internal linking`);
      }
    } else {
      console.log(`⚠️  Content defaults not configured`);
      console.log(`\nℹ️  Onboarding may not be complete or content defaults were not saved`);
    }

    console.log('\n✨ Query completed successfully\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the check
checkInternalLinksConfig().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
