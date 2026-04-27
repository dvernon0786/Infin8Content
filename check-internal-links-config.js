#!/usr/bin/env node

/**
 * Script to verify internal links configuration for a user who just completed onboarding
 *
 * Usage: node check-internal-links-config.js
 *
 * Requirements:
 * - Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env or pass as env vars
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

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

async function checkInternalLinksConfig() {
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

    console.log('✅ Organization Found:');
    console.log(`   Name: ${orgData.name}`);
    console.log(`   Created: ${orgData.created_at}`);
    console.log(`   Updated: ${orgData.updated_at}`);

    // 2. Extract content defaults
    console.log('\n2️⃣  Content Defaults Configuration:\n');
    const contentDefaults = orgData.content_defaults;

    if (!contentDefaults) {
      console.warn('⚠️  No content_defaults found in organization');
    } else {
      console.log('✅ Content Defaults:');
      console.log(`   Language: ${contentDefaults.language || 'not set'}`);
      console.log(`   Tone: ${contentDefaults.tone || 'not set'}`);
      console.log(`   Style: ${contentDefaults.style || 'not set'}`);
      console.log(`   Target Word Count: ${contentDefaults.target_word_count || 'not set'}`);
      console.log(`   Auto Publish: ${contentDefaults.auto_publish ? 'Yes' : 'No'}`);
      console.log(`   Brand Color: ${contentDefaults.brand_color || 'not set'}`);
      console.log(`   Image Style: ${contentDefaults.image_style || 'not set'}`);

      // Internal Links Configuration (KEY INFO)
      console.log('\n   🔗 INTERNAL LINKS CONFIGURATION:');
      console.log(`      ├─ Enabled: ${contentDefaults.internal_links === true ? '✅ YES' : contentDefaults.internal_links === false ? '❌ NO' : '⚠️  NOT SET'}`);
      console.log(`      └─ Max Links: ${contentDefaults.num_internal_links ?? '⚠️  NOT SET'}`);

      // Other toggles
      console.log(`\n   Other Features:`);
      console.log(`   ├─ Add YouTube Videos: ${contentDefaults.add_youtube_video ? '✅' : '❌'}`);
      console.log(`   ├─ Add CTA: ${contentDefaults.add_cta ? '✅' : '❌'}`);
      console.log(`   ├─ Add Infographics: ${contentDefaults.add_infographics ? '✅' : '❌'}`);
      console.log(`   └─ Add Emojis: ${contentDefaults.add_emojis ? '✅' : '❌'}`);
    }

    // 3. Check website info
    console.log('\n3️⃣  Website Information:\n');
    const websiteUrl = orgData.website_url;

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
      console.log(`✅ Found ${articlesData.length} article(s):`);
      articlesData.forEach((article, i) => {
        console.log(`\n   ${i + 1}. ${article.title}`);
        console.log(`      Status: ${article.status}`);
        console.log(`      Slug: ${article.slug || 'none'}`);
        console.log(`      Words: ${article.word_count}`);
        console.log(`      Created: ${new Date(article.created_at).toLocaleString()}`);
      });

      // 5. Check sections for internal links
      console.log('\n5️⃣  Article Sections with Link Detection:\n');
      const articleIds = articlesData.map(a => a.id);

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
          let linksFoundCount = 0;

          sectionsData.forEach((section) => {
            const hasHtmlLinks = section.content_html && section.content_html.includes('<a href=');
            const hasMarkdownLinks = section.content_markdown && section.content_markdown.includes('](');

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
            console.log(`\n✅ Total sections with links: ${linksFoundCount} of ${sectionsData.length}`);
          }
        }
      }
    }

    // 6. Summary
    console.log('\n' + '─'.repeat(80));
    console.log('\n📊 SUMMARY:\n');

    if (contentDefaults) {
      const internalLinksEnabled = contentDefaults.internal_links === true;
      const maxLinks = contentDefaults.num_internal_links;

      if (internalLinksEnabled) {
        console.log(`✅ Internal linking is ENABLED`);
        console.log(`✅ Max links per article: ${maxLinks}`);
      } else {
        console.log(`❌ Internal linking is DISABLED`);
      }
    } else {
      console.log(`⚠️  Content defaults not configured - onboarding may not be complete`);
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
