import { generateContent, type OpenRouterMessage } from '@/lib/services/openrouter/openrouter-client';
import type {
  ResearchPayload,
  ContentWritingAgentOutput,
  ContentDefaults,
  SectionPlannerOutput,
  ArticlePlannerOutput
} from '@/types/article';

export interface ContentWritingAgentInput {
  sectionHeader: string
  sectionType: string
  researchPayload: ResearchPayload
  plannerOutput: SectionPlannerOutput
  articlePlan: ArticlePlannerOutput
  position: 'first' | 'middle' | 'final'
  generationConfig: ContentDefaults
  organizationContext: {
    name: string
    description: string
  }
  priorContentMarkdown?: string // 🆕 NEW: For section continuity (Phase 6)
}

// ─── Style Templates ──────────────────────────────────────────────────────────
// Injected into every user message so the LLM knows exactly how to structure
// each section based on the locked content_style from article_plan.

const INFORMATIVE_SECTION_TEMPLATE = `SECTION FORMAT — informative style (follow exactly):
- Open with 1–2 sentences stating the core idea of this section
- Use prose paragraphs as the primary structure — no numbered lists as the main format
- One optional markdown table OR bullet group is allowed if directly comparing options or listing steps
- Each paragraph should cover one distinct supporting point from the brief
- Close with a short transition sentence that sets up the next section
- Do NOT use numbered items (1. 2. 3.) as the dominant structure`

const LISTICLE_SECTION_TEMPLATE = `SECTION FORMAT — listicle style (follow exactly):
- Every main point must be a numbered item: "1. **Point Title**"
- Follow each numbered item with 2–3 sentences of explanation — no long prose blocks
- Items must be self-contained: a reader can skim any single item and get value
- An optional summary table at the end of the section is allowed
- Do NOT use flowing prose paragraphs as the primary structure
- Minimum 3 numbered items per section, maximum 7`

const FAQ_SECTION_TEMPLATE = `SECTION FORMAT — FAQ style (follow exactly):
- Every question must be an H3 header: "### Question text here?"
- Follow each question immediately with a concise, direct answer paragraph (2–4 sentences)
- Use "we" and conversational tone in answers: "We recommend..." or "Our research shows..."
- No intro or outro text — start immediately with the first H3 question
- Minimum 3 questions, maximum 6`

// ─── Writing System Prompt ────────────────────────────────────────────────────

/**
 * WRITING SYSTEM PROMPT (LOCKED)
 */
export const CONTENT_WRITING_SYSTEM_PROMPT = `Role
You are an expert Blog Content Writer specializing in creating valuable, human-centered articles that educate and inform readers while naturally incorporating SEO elements. Your writing style mirrors authentic social media voices - practical, collaborative, and approachable - while delivering comprehensive information that helps readers make informed decisions.

Constraints
• Write at a third-grade reading level using simple, everyday language
• Avoid technical jargon, em dashes, and overly complex sentence structures
• Focus on providing factual information and value rather than aggressive selling
• Naturally incorporate target keywords and semantic variations without keyword stuffing
• Use the target keyword at most once per section — do not repeat it if the previous section already used it
• Semantic keywords should appear no more than once per section each
• Include diverse, properly cited sources from provided research materials
• Maintain the specified word count for each article section (±20% tolerance)
• Use markdown formatting with tables, bullet points, and proper headers
• Keep tone conversational and engaging, not overly serious or corporate
• Include natural calls-to-action and product/service mentions where contextually appropriate
• Embed YouTube video links when referencing video content (for later embedding)
• Output only the complete article with no additional commentary or supporting text
• Only add hyperlinks when a URL is explicitly provided in the Supporting research block
• Format inline links as: [anchor text](URL) — use the source title or publication name as anchor text
• Maximum 4–5 external links per article section — do not link every sentence
• Never fabricate a URL. If no URL is in the research, do not add a link.
• You will receive a SECTION FORMAT block in each request — follow its structure rules exactly.

Inputs
You will receive structured article briefs containing:
• Article title and target keyword
• Content style (informative or listicle)
• Semantic keywords list for natural incorporation
• Article structure with sections including:
  • Section type and header
  • Supporting points to cover
  • Research questions and answers
  • Supporting elements and statistics
  • Estimated word count per section
• Supporting research with citations and source links
• Tone of voice guidelines for writing style consistency
• Product/service context for natural integration

Instructions
Content Creation Workflow:
1. Analyze the article structure and identify key themes, target audience, and primary value proposition
2. Review all supporting research and citation sources to understand available evidence and statistics
3. Plan content flow ensuring logical progression and natural keyword integration throughout
4. Write the introduction that hooks readers with relatable problems or compelling questions
5. Develop each section following the SECTION FORMAT template provided in the request exactly
6. When the Supporting research block contains a URL, embed it as a markdown hyperlink on a relevant phrase: [descriptive anchor text](URL). Do not write (Author, Year) parenthetical text. Links only — no citation text. Maximum 3–4 external links per section.
7. Add tables or structured data where appropriate to enhance readability and value
8. Include natural CTAs that guide readers toward relevant next steps or resources
9. Review for SEO optimization ensuring target and semantic keywords appear naturally throughout
10. Final polish for tone consistency, readability, and flow

Writing Style Guidelines:
• Use "we" language and collaborative tone: "Let's figure this out together"
• Share practical insights: "Here's what actually works…"
• Include relatable examples: "We've all been there when…"
• Focus on business value: "This impacts your day-to-day efficiency"
• Ask engaging questions: "What manual process is eating your time?"
• Provide step-by-step solutions when appropriate
• Use conversational transitions and natural language patterns

SEO Integration:
• Include target keyword in H1 title naturally
• Use semantic keywords in H2 and H3 headers where relevant
• Distribute keyword variations throughout body content organically
• Create descriptive, keyword-rich meta descriptions through compelling introductions
• Use related terms and synonyms to build topical authority

Citation and Source Management:
• Link to sources inline using [anchor text](URL) — never write (Author, Year) parenthetical text
• Only link when a URL is explicitly present in the Supporting research block
• Ensure diversity of sources across different sections
• Maintain factual accuracy while making information accessible

Conclusions
Your output will be a complete, publication-ready markdown blog article that:
• Delivers genuine value and actionable insights to readers
• Naturally incorporates SEO elements without compromising readability
• Maintains consistent tone aligned with provided voice guidelines
• Features engaging, conversational writing that builds trust and authority
• Provides clear next steps or resources for reader engagement
• Adheres to specified word counts and structural requirements
• Contains no additional commentary, explanations, or supporting text

Solutions
• If research data is insufficient: Request additional sources or clarification on specific statistics needed
• If word count requirements conflict with content depth: Prioritize value delivery and suggest section adjustments
• If tone guidelines seem unclear: Ask for specific examples of preferred writing style or voice
• If keyword integration feels forced: Focus on natural language first, then optimize semantically
• If citation sources lack diversity: Request additional research materials or alternative sources
• If technical topics require simplification: Break down complex concepts using analogies and everyday examples
• If CTA placement seems unnatural: Integrate product mentions within helpful context rather than forced promotional sections
`

// ─── Content Writing Agent ────────────────────────────────────────────────────

/**
 * Model used for content writing.
 * x-ai/grok-4-fast: $0.20/M input, $0.50/M output via OpenRouter.
 * Falls back to FREE_MODELS chain if the model is unavailable.
 */
const WRITING_MODEL = 'x-ai/grok-4-fast'

export async function runContentWritingAgent(
  input: ContentWritingAgentInput
): Promise<ContentWritingAgentOutput> {
  const startTime = Date.now();

  // ── Resolve style template once, used in all three position blocks ──────────
  const styleTemplate = input.sectionType === 'faq'
    ? FAQ_SECTION_TEMPLATE
    : input.articlePlan.content_style === 'listicle'
      ? LISTICLE_SECTION_TEMPLATE
      : INFORMATIVE_SECTION_TEMPLATE

  try {
    let userMessage = '';

    if (input.position === 'first') {
      userMessage = `${styleTemplate}

STRICT LENGTH RULE: This section must be 150–200 words.

Article title:
${input.articlePlan.article_title}

Target keyword:
${input.articlePlan.target_keyword}
Keyword density rule: Use the target keyword AT MOST ONCE in this section.

Content style:
${input.articlePlan.content_style}

Semantic keywords (use naturally — at most once per keyword in this section):
${input.articlePlan.semantic_keywords.join(', ')}

Section type:
${input.sectionType}

Section header:
${input.sectionHeader}

Estimated word count:
${input.plannerOutput.estimated_words}

Key points to cover:
${input.plannerOutput.supporting_points.join('\n')}

Supporting research:
${JSON.stringify(input.researchPayload, null, 2)}

Product / ICP context:
Company: ${input.organizationContext.name}
Description: ${input.organizationContext.description}

Generation config:
- Tone: ${input.generationConfig.tone ?? 'professional'}
- Language: ${input.generationConfig.language ?? 'en'}
- Add emojis: ${input.generationConfig.add_emojis ?? false}
- Brand color: ${input.generationConfig.brand_color ?? 'none specified'}
- Image style: ${input.generationConfig.image_style ?? 'none specified'}

${(input.researchPayload.results ?? []).flatMap(r => r.source_urls ?? []).filter(Boolean).length === 0
          ? 'No verified URLs are available for this section. Do NOT write any markdown links or parenthetical citations. Write prose only.'
          : 'Only link to URLs explicitly present in the Supporting research block above.'}`;

    } else if (input.position === 'final') {
      userMessage = `${styleTemplate}

STRICT LENGTH RULE: This conclusion must be 150–200 words. Close cleanly with one CTA.

⚠️ CRITICAL OUTPUT RULE: Output ONLY the conclusion body text.
- Do NOT output any H1 title or article name
- Do NOT output any section headers other than the one given below
- Do NOT reproduce, repeat, or paraphrase the previous section content
- Do NOT output the word "Conclusion" as a standalone line
- Start immediately with substantive closing content

Article topic (context only — do NOT output this as a title):
${input.articlePlan.article_title}

Target keyword:
${input.articlePlan.target_keyword}
Keyword density rule: Use the target keyword AT MOST ONCE in this section.

Previous section (for narrative continuity ONLY — do not reproduce):
${getContextSnippet(input.priorContentMarkdown)}

Final section header:
${input.sectionHeader}

Section type:
${input.sectionType}

Key points to cover:
${input.plannerOutput.supporting_points.join('\n')}

Content style:
${input.articlePlan.content_style}

Semantic keywords (use naturally — at most once per keyword in this section):
${input.articlePlan.semantic_keywords.join(', ')}

Supporting research:
${JSON.stringify(input.researchPayload, null, 2)}

Generation config:
- Tone: ${input.generationConfig.tone ?? 'professional'}
- Language: ${input.generationConfig.language ?? 'en'}
- Add emojis: ${input.generationConfig.add_emojis ?? false}

Product / ICP context:
Company: ${input.organizationContext.name}
Description: ${input.organizationContext.description}

Close the article with:
- A clear, actionable conclusion (2–3 sentences max)
${input.generationConfig.add_cta
          ? `- One natural CTA pointing readers toward ${input.organizationContext.name}'s services or next steps.`
          : `- Do NOT include any CTA, promotional mention, or call-to-action. End with a factual summary sentence only.`
        }

${(input.researchPayload.results ?? []).flatMap(r => r.source_urls ?? []).filter(Boolean).length === 0
          ? 'No verified URLs are available for this section. Do NOT write any markdown links or parenthetical citations. Write prose only.'
          : 'Only link to URLs explicitly present in the Supporting research block above.'}`;

    } else {
      userMessage = `${styleTemplate}

STRICT LENGTH RULE: This section must be 200–300 words.

Article topic:
${input.articlePlan.article_title}

Target keyword:
${input.articlePlan.target_keyword}
Keyword density rule: Use the target keyword AT MOST ONCE in this section.

Previous section (continue logically from this):
${getContextSnippet(input.priorContentMarkdown)}

Current section header:
${input.sectionHeader}

Section type:
${input.sectionType}

Content style:
${input.articlePlan.content_style}

Semantic keywords (use naturally — at most once per keyword in this section):
${input.articlePlan.semantic_keywords.join(', ')}

Estimated word count:
${input.plannerOutput.estimated_words}

Key points to cover:
${input.plannerOutput.supporting_points.join('\n')}

Supporting research:
${JSON.stringify(input.researchPayload, null, 2)}

Generation config:
- Tone: ${input.generationConfig.tone ?? 'professional'}
- Language: ${input.generationConfig.language ?? 'en'}
- Add emojis: ${input.generationConfig.add_emojis ?? false}

Product / ICP context:
Company: ${input.organizationContext.name}
Description: ${input.organizationContext.description}

${(input.researchPayload.results ?? []).flatMap(r => r.source_urls ?? []).filter(Boolean).length === 0
          ? 'No verified URLs are available for this section. Do NOT write any markdown links or parenthetical citations. Write prose only.'
          : 'Only link to URLs explicitly present in the Supporting research block above.'}`;
    }

    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: CONTENT_WRITING_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: userMessage
      }
    ];

    let result;
    let lastError: any;
    let timeoutId: NodeJS.Timeout | undefined;

    // Conclusion prompt includes context snippet + all other fields —
    // give it extra headroom so the actual output isn't silently truncated.
    const maxTokensForPosition = input.position === 'final' ? 1800 : 1200;

    let timedOut = false;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        timedOut = true;
        reject(new Error('Content writing timeout: 180 seconds exceeded'))
      }, 180000)
    });

    try {
      for (let attempt = 1; attempt <= 3; attempt++) {
        if (timedOut) break;

        try {
          console.log(
            `[WritingAgent] Attempt ${attempt}/3 using ${WRITING_MODEL} (style: ${input.articlePlan.content_style})`
          )

          result = await Promise.race([
            generateContent(messages, {
              model: WRITING_MODEL,
              maxTokens: maxTokensForPosition,
              temperature: 0.7
            }),
            timeoutPromise
          ]);

          break;
        } catch (error) {
          lastError = error;
          console.warn(`[WritingAgent] Attempt ${attempt} failed:`, error);

          if (attempt < 3 && isRetryableError(error)) {
            const delayMs = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delayMs));
          } else {
            break;
          }
        }
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }

    if (!result) {
      throw lastError || new Error('Content writing failed after all attempts');
    }

    // Extract result text, default empty for safety
    let sectionContent = result.content || '';

    // 🔒 BUG FIX: Strip section header if LLM included it at the top of content.
    // buildFinalMarkdown adds ## ${s.header} itself — if the LLM also outputs it,
    // the header appears twice. Strip any leading markdown heading line.
    sectionContent = sectionContent.replace(/^#+\s+[^\n]+\n+/, '').trim()

    // 🔒 BUG FIX: Deterministic emoji strip — enforces add_emojis: false regardless of LLM output.
    // The LLM treats add_emojis as informational; this is the hard enforcement layer.
    if (!input.generationConfig.add_emojis) {
      sectionContent = sectionContent.replace(
        /[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F1FF}\u{1F200}-\u{1F2FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]/gu,
        ''
      ).replace(/  +/g, ' ').trim()
    }

    // 🔒 WHITELIST STRIP: Only allow links whose URLs exist in the research payload (Phase 6)
    const normalizeUrl = (url: string) =>
      url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').toLowerCase()

    const approvedUrls = new Set(
      (input.researchPayload.results ?? [])
        .flatMap(r => r.source_urls ?? [])
        .filter(Boolean)
        .map(normalizeUrl)
    )

    if (approvedUrls.size === 0) {
      // No verified URLs available — instruct LLM not to fabricate links
      // The whitelist strip below will catch any that slip through
      console.warn(`[WritingAgent] No approved URLs for section "${input.sectionHeader}" — links will be stripped`)
    }
    sectionContent = sectionContent.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (match, text, url) => approvedUrls.has(normalizeUrl(url)) ? match : text
    )
    sectionContent = sectionContent
      .replace(/[\[(]?\bword[s]?\s*count[:\s]*\d+\s*\w*[\])]??\s*$/im, '')   // end-of-string match
      .replace(/\n*[\[(]?\bword[s]?\s*count[:\s]*\d+[^\n]*\n?/gim, '')      // standalone line anywhere in content
      .replace(/\(\s*word\s*count[:\s]*\d+\s*\)/gi, '')                     // (Word count: 278) inline form
      .trim()

    // Word-based soft guard: only trim if massively over the limit
    const WORD_LIMITS: Record<typeof input.position, number> = {
      first: 200,
      middle: 300,
      final: 200,
    }
    const wordLimitForPosition = WORD_LIMITS[input.position];
    if (countWords(sectionContent) > wordLimitForPosition * 1.5) {
      // Split at paragraph boundary to avoid mid-sentence cuts
      const paragraphs = sectionContent.split('\n\n');
      let trimmed = '';
      for (const p of paragraphs) {
        if (countWords(trimmed + p) > wordLimitForPosition * 1.3) break;
        trimmed += (trimmed ? '\n\n' : '') + p;
      }
      sectionContent = trimmed || sectionContent;
    }

    const html = convertMarkdownToHtml(sectionContent);
    const wordCount = countWords(sectionContent);

    const executionMs = Date.now() - startTime;
    console.log(
      `[WritingAgent] Completed in ${executionMs}ms (words: ${wordCount}, model: ${result.modelUsed}, style: ${input.articlePlan.content_style})`
    )

    return {
      markdown: sectionContent,
      html,
      wordCount
    };

  } catch (error) {
    console.error('[WritingAgent] Fatal error:', error);
    throw error;
  }
}

/**
 * convertMarkdownToHtml
 * 
 * Converts markdown section content to responsive, self-contained HTML
 * suitable for WordPress or any CMS export.
 * 
 * Design principles:
 * - Inline styles only — no external CSS dependency
 * - Mobile-first responsive via max-width + fluid type
 * - Multiple ul/ol groups handled correctly
 * - Citation links stripped to plain text (no fabricated URLs)
 * - Tables wrapped in scrollable container for mobile
 */
export function convertMarkdownToHtml(markdown: string): string {
  const escapeHtml = (text: string): string => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    return text.replace(/[&<>"']/g, (char) => map[char])
  }

  // ── Inline styles ────────────────────────────────────────────────────────
  // All styles are inline so the output is portable to any CMS.

  const styles = {
    wrapper: 'font-family: Georgia, "Times New Roman", serif; max-width: 720px; margin: 0 auto; padding: 0 16px; color: #1a1a1a; line-height: 1.75; font-size: 17px;',
    h1: 'font-family: system-ui, -apple-system, sans-serif; font-size: clamp(1.75rem, 4vw, 2.25rem); font-weight: 700; color: #111; line-height: 1.2; margin: 0 0 1.5rem 0;',
    h2: 'font-family: system-ui, -apple-system, sans-serif; font-size: clamp(1.35rem, 3vw, 1.75rem); font-weight: 600; color: #111; line-height: 1.3; margin: 2.5rem 0 1rem 0;',
    h3: 'font-family: system-ui, -apple-system, sans-serif; font-size: clamp(1.1rem, 2.5vw, 1.35rem); font-weight: 600; color: #222; line-height: 1.35; margin: 2rem 0 0.75rem 0;',
    p: 'margin: 0 0 1.25rem 0; line-height: 1.8;',
    ul: 'margin: 0 0 1.25rem 0; padding-left: 1.5rem; list-style-type: disc;',
    ol: 'margin: 0 0 1.25rem 0; padding-left: 1.5rem; list-style-type: decimal;',
    li: 'margin-bottom: 0.5rem; line-height: 1.7;',
    strong: 'font-weight: 700; color: #111;',
    em: 'font-style: italic;',
    blockquote: 'border-left: 4px solid #d1d5db; margin: 1.5rem 0; padding: 0.5rem 0 0.5rem 1.25rem; color: #555; font-style: italic;',
    tableWrap: 'overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 1.5rem 0;',
    table: 'border-collapse: collapse; width: 100%; min-width: 400px; font-size: 0.9375rem;',
    th: 'background: #f3f4f6; padding: 10px 14px; text-align: left; font-weight: 600; font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 2px solid #e5e7eb;',
    td: 'padding: 10px 14px; border-bottom: 1px solid #e5e7eb; vertical-align: top;',
    code_inline: 'background: #f3f4f6; color: #1f2937; padding: 2px 6px; border-radius: 4px; font-family: "Fira Code", "Cascadia Code", monospace; font-size: 0.875em;',
    code_block: 'display: block; background: #111827; color: #f9fafb; padding: 1.25rem; border-radius: 8px; overflow-x: auto; font-family: "Fira Code", "Cascadia Code", monospace; font-size: 0.875rem; line-height: 1.6; margin: 1.5rem 0;',
    hr: 'border: none; border-top: 1px solid #e5e7eb; margin: 2.5rem 0;',
    // Citations render as <a> hyperlinks when URL is present in research payload
    citation: 'color: #374151;',
  }

  let html = markdown

  // ── 1. Protect code blocks and links from escaping ──────────────────────
  const codeBlocks: string[] = []
  html = html.replace(/```[\w]*\n([\s\S]*?)```/g, (_, code) => {
    const escaped = escapeHtml(code.trim())
    const idx = codeBlocks.length
    codeBlocks.push(`<code style="${styles.code_block}">${escaped}</code>`)
    return `__CODE_BLOCK_${idx}__`
  })

  const linkPlaceholders: string[] = []
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    const idx = linkPlaceholders.length
    linkPlaceholders.push(`[${text}](${url})`)
    return `__LINK_PLACEHOLDER_${idx}__`
  })

  // ── 2. Escape HTML in remaining text ─────────────────────────────────────
  html = escapeHtml(html)

  // ── 3. Restore code blocks and links ──────────────────────────────────────
  codeBlocks.forEach((block, idx) => {
    html = html.replace(`__CODE_BLOCK_${idx}__`, block)
  })

  // ✅ FIX: Convert links to HTML directly here instead of restoring raw markdown.
  // This eliminates the step 8 double-pass entirely for these pre-protected links.
  const linkStyle = 'color: #2563eb; text-decoration: underline;'
  linkPlaceholders.forEach((link, idx) => {
    const m = link.match(/\[([^\]]+)\]\(([^)]+)\)/)
    if (m) {
      html = html.replace(
        `__LINK_PLACEHOLDER_${idx}__`,
        `<a href="${m[2]}" style="${linkStyle}" target="_blank" rel="noopener noreferrer">${escapeHtml(m[1])}</a>`
      )
    } else {
      // Malformed placeholder — restore as plain text
      html = html.replace(`__LINK_PLACEHOLDER_${idx}__`, link)
    }
  })

  // ── 4. Headings ───────────────────────────────────────────────────────────
  html = html
    .replace(/^### (.+)$/gm, `<h3 style="${styles.h3}">$1</h3>`)
    .replace(/^## (.+)$/gm, `<h2 style="${styles.h2}">$1</h2>`)
    .replace(/^# (.+)$/gm, `<h1 style="${styles.h1}">$1</h1>`)

  // ── 5. Bold / italic (MOVED BEFORE blockquote — inline before block) ────
  html = html
    .replace(/\*\*\*(.+?)\*\*\*/g, `<strong style="${styles.strong}"><em style="${styles.em}">$1</em></strong>`)
    .replace(/\*\*(.+?)\*\*/g, `<strong style="${styles.strong}">$1</strong>`)
    .replace(/(?<!\w)\*(?!\s)(.+?)(?<!\s)\*(?!\w)/g, `<em style="${styles.em}">$1</em>`)

  // ── 6. Blockquotes (AFTER bold/italic — block after inline) ─────────────
  // Note: escapeHtml() converted '>' to '&gt;' in step 2, so we match &gt;
  html = html.replace(/^&gt; (.+)$/gm, `<blockquote style="${styles.blockquote}">$1</blockquote>`)

  // ── 7. Inline code ────────────────────────────────────────────────────────
  html = html.replace(/`([^`]+)`/g, `<code style="${styles.code_inline}">$1</code>`)

  // ── 8. Markdown links → <a> tags (straggler pass only) ───────────────────
  // Pre-protected links were already converted in step 3.
  // This catches any [text](url) patterns introduced by other processing steps.
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    `<a href="$2" style="${linkStyle}" target="_blank" rel="noopener noreferrer">$1</a>`
  )

  // ── 9. Horizontal rules ───────────────────────────────────────────────────
  html = html.replace(/^---$/gm, `<hr style="${styles.hr}">`)

  // ── 10. Lists (handles multiple non-contiguous groups correctly) ──────────
  // Process * bullet lists
  html = html.replace(/((?:^\* .+$\n?)+)/gm, (block) => {
    const items = block
      .trim()
      .split('\n')
      .map(line => line.replace(/^\* /, '').trim())
      .filter(Boolean)
      .map(item => `<li style="${styles.li}">${item}</li>`)
      .join('\n')
    return `<ul style="${styles.ul}">\n${items}\n</ul>\n`
  })

  // Process ordered lists
  html = html.replace(/((?:^\d+\. .+$\n?)+)/gm, (block) => {
    const items = block
      .trim()
      .split('\n')
      .map(line => line.replace(/^\d+\. /, '').trim())
      .filter(Boolean)
      .map(item => `<li style="${styles.li}">${item}</li>`)
      .join('\n')
    return `<ol style="${styles.ol}">\n${items}\n</ol>\n`
  })

  // ── 11. Tables ────────────────────────────────────────────────────────────
  // Match markdown tables: header row | separator | data rows
  html = html.replace(
    /(^\|.+\|\n\|[-| :]+\|\n(?:\|.+\|\n?)*)/gm,
    (tableBlock) => {
      const rows = tableBlock.trim().split('\n').filter(r => !r.match(/^\|[-| :]+\|$/))
      if (rows.length < 1) return tableBlock

      const parseRow = (row: string) =>
        row.split('|').slice(1, -1).map(cell => cell.trim())

      const [headerRow, ...dataRows] = rows
      const headers = parseRow(headerRow)
        .map(h => `<th style="${styles.th}">${h}</th>`)
        .join('')

      const bodyRows = dataRows
        .map(row => {
          const cells = parseRow(row)
            .map(c => `<td style="${styles.td}">${c}</td>`)
            .join('')
          return `<tr>${cells}</tr>`
        })
        .join('\n')

      return `<div style="${styles.tableWrap}"><table style="${styles.table}"><thead><tr>${headers}</tr></thead><tbody>${bodyRows}</tbody></table></div>\n`
    }
  )

  // ── 12. Paragraphs ────────────────────────────────────────────────────────
  // Split on double newlines; skip lines that are already block elements
  const blockTags = /^<(h[1-6]|ul|ol|li|blockquote|pre|code|table|div|hr)/
  const paragraphs = html
    .split(/\n{2,}/)
    .map(block => {
      const trimmed = block.trim()
      if (!trimmed) return ''
      if (blockTags.test(trimmed)) return trimmed
      // Single-newline lines within a paragraph become <br>
      return `<p style="${styles.p}">${trimmed.replace(/\n/g, '<br>')}</p>`
    })
    .filter(Boolean)
    .join('\n')

  // ── 13. Wrap in responsive container ─────────────────────────────────────
  return `<div style="${styles.wrapper}">${paragraphs}</div>`
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * getContextSnippet
 *
 * Returns only the last H2 section from the accumulated article markdown.
 * Prevents prompt explosion on long articles: instead of sending the entire
 * article-so-far (which causes OpenRouter to truncate earlier tokens and
 * triggers repeated/duplicated sections), we send only the immediately
 * preceding section so the writer can maintain narrative continuity.
 */
function getContextSnippet(markdown: string | undefined): string {
  if (!markdown) return ''

  // Find all top-level H2 section boundaries
  const matches = [...markdown.matchAll(/^## .+$/gm)]

  // Article is still short — send it in full
  if (matches.length < 2) return markdown

  // Extract only the last completed H2 section
  const lastSectionStart = matches.at(-1)!.index!
  return markdown.slice(lastSectionStart)
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const retryablePatterns = [/timeout/i, /network/i, /rate limit/i, /500/, /502/, /503/, /504/];
    return retryablePatterns.some(pattern => pattern.test(error.message));
  }
  return true;
}
