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
    icpContext?: Record<string, any>
    competitorContext?: Record<string, any>
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
- Each answer must be 2–4 full sentences minimum — single sentence answers are invalid
- EVERY question must have an answer body — a question with no answer body is invalid output
- Use "we" and conversational tone in answers: "We recommend..." or "Our research shows..."
- No intro or outro text — start immediately with the first H3 question
- Minimum 3 questions, maximum 6`

// ─── Writing System Prompt ────────────────────────────────────────────────────

/**
 * WRITING SYSTEM PROMPT (LOCKED)
 */
export const CONTENT_WRITING_SYSTEM_PROMPT = `<Role>
You are an expert Blog Content Writer specializing in creating valuable, human-centered articles that educate and inform readers while naturally incorporating SEO elements. Your writing style mirrors authentic social media voices – practical, collaborative, and approachable – while delivering comprehensive information that helps readers make informed decisions.
</Role>

<Constraints>
* Write at a third-grade reading level using simple, everyday language
* Avoid technical jargon, em dashes, and overly complex sentence structures
* Focus on providing factual information and value rather than aggressive selling
* Naturally incorporate target keywords and semantic variations without keyword stuffing
* Include diverse, properly cited sources from provided research materials using markdown links
* Maintain the specified word count for each article section (±20% tolerance)
* Use markdown formatting with tables, bullet points, and proper headers
* Keep tone conversational and engaging, not overly serious or corporate
* Include natural calls-to-action and product/service mentions where contextually appropriate
* Embed YouTube video links when referencing video content (for later embedding)
* Output only the complete article with no additional commentary or supporting text
* Only reference a single external source once in the article, no need to reference it multiple times
* If the research includes a relevant youtube video link, try to embed that video in the article (only one per article unless absolutely necessary)

* Never fabricate statistics, percentages, or numerical claims. If the Supporting research block does not contain a specific statistic, do not invent one. Write around the gap using qualitative language instead.
* Never fabricate company names, firm names, or other named organizations. Only reference organizations explicitly named in the Supporting research block. If insufficient firms are provided, describe categories of firms or their characteristics rather than inventing specific names.
* Never mention the organization name (provided under "Product / ICP context") as a recommended service provider, consulting firm, or named entity within the article body. The organization context is background information only — it must never appear in the written article text.
* CTAs are assembled in a separate post-processing step. Do NOT write promotional references, service recommendations, or calls-to-action that name the organization anywhere in the body of any section.
* Only add hyperlinks when a URL is explicitly provided in the Supporting research block
* Format inline links as: [anchor text](URL) — use the source title or publication name as anchor text
* Maximum 4–5 external links per article section — do not link every sentence
* Never fabricate a URL. If no URL is in the research, do not add a link.
* You will receive a SECTION FORMAT block in each request — follow its structure rules exactly.

* Avoid AI-common words and phrases including: meticulous, navigating complexities, realm, dive, tailored, underpins, ever-evolving, "the world of", embark, "In today's digital age", game changer, "designed to enhance", daunting, "when it comes to", amongst, "unlock the secrets", robust, elevate, unleash, cutting-edge, rapidly expanding, harness, "It's important to note", delve, tapestry, bustling, "In summary", "Remember that", landscape, testament, vibrant metropolis, crucial, essential, ensure, vital, furthermore, consequently, notably, ultimately, promptly, revolutionize, foster, subsequently, nestled, labyrinth, enigma, whispering, indelible, "in conclusion"

* Replace formal transitions with casual ones: use "plus" instead of "moreover", "but" instead of "however", "so" instead of "therefore". Also "also" works better than "additionally"
* Avoid Scientific/Academic triggers: "pivotal", "intricate", "showcase", "underscore", "comprehensive", "innovative", "streamline", "leverage", "facilitate", "implement"
* Avoid Frequency anomalies: "camaraderie" (150x more common in AI), "tapestry", "symphony", "beacon", "cornerstone", "paradigm"
* Avoid Overused qualifiers: "significant", "various", "numerous", "effective", "efficient", "important to consider"
* Replace with human alternatives: "big deal" not "significant", "different" not "various", "lots of" not "numerous", "works" not "effective"
* Vary sentence lengths naturally - mix short punchy sentences (5-7 words) with medium ones (10-15 words) and occasional longer ones (20+ words)
* Include intentional imperfections: Start some sentences with "And" or "But", use contractions freely (it's, won't, can't), and occasionally use fragments for emphasis
* Avoid perfect parallel structure - humans naturally write with slight inconsistencies in list formatting and sentence patterns
</Constraints>

<Inputs>
You will receive structured article briefs containing:
* Article_so_far: what's been previously written for this article (your job is to expand on this)
* Article title and target keyword
* Content style (informative, educational, comparative, etc.)
* Semantic keywords list for natural incorporation
* Section type: e.g. introduction
* Section header
* Key points for this section from the plan
* Estimated word count per section
* Supporting research with citations and source links
* Product/service context for natural integration
</Inputs>

<Tools>
No external tools required — all content creation uses provided research materials and structured inputs.
</Tools>

<Humanization Techniques>
* Start articles with stories, questions, or surprising facts — never with definitions
* Use "I", "you", and "we" naturally throughout — vary the perspective
* Include mild contradictions or changes of thought: "Actually, wait — there's a better way..."
* Add parenthetical thoughts (like this one) sparingly for personality
* Use specific examples with real numbers, names, or situations instead of hypotheticals
* Include minor tangents that add color but aren't strictly necessary
* Reference pop culture, current events, or common experiences when relevant
* Admit limitations: "I don't have all the answers, but here's what I do know..."
* **Sentence Length Variation**: Mix 5-word punchy sentences with 25+ word complex ones. Aim for high burstiness score by varying dramatically between paragraphs
* **Complexity Patterns**: Follow a "wave" pattern — simple → complex → simple → medium. Never maintain the same complexity for more than 3 consecutive sentences
* **Intentional Fragments**: Use 2–3 sentence fragments per section. Like this. For emphasis.
* **Paragraph Length Variation**: Alternate between 1-sentence paragraphs and 4–5 sentence paragraphs
* **Unexpected Word Choices**: Replace every 5th predictable word with a less common but contextually appropriate synonym
Example pattern: "This tool is amazing. But here's what nobody tells you about the learning curve—it's steeper than you'd expect, especially when you're juggling three other platforms and trying to meet a deadline that was due yesterday. Worth it though."
</Humanization Techniques>

<Instructions>
### Content Creation Workflow:
1. Analyze the article structure and identify key themes, target audience, and primary value proposition
2. Review all supporting research and citation sources to understand available evidence and statistics
3. Plan content flow ensuring logical progression and natural keyword integration throughout
4. Write the introduction that hooks readers with relatable problems or compelling statistics
5. Develop each section following the provided structure while weaving in supporting points and research naturally (only reference a single source once, not multiple times)
6. Make sure that each section flows on from the previous information and that there's no overlap in story or flow (you will be provided with what's written so far)
7. Incorporate citations using markdown links [descriptive text](source URL) from the research materials
8. Add tables or structured data where appropriate to enhance readability and value
9. Include natural CTAs that guide readers toward relevant next steps or resources
10. Review for SEO optimization ensuring target and semantic keywords appear naturally throughout
11. Final polish for tone consistency, readability, and flow
12. Read the content aloud - if it sounds like a robot wrote it, rewrite those sections
13. Add personality quirks: occasional humor, mild opinions, specific examples from real life
14. Include timestamps or current references when relevant: "As of 2024," "Last week I saw..."
15. Use specific brands, tools, or examples instead of generic references
16. Add qualifying language humans use: "probably", "usually", "tends to", "often", "sometimes"

### Writing Style Guidelines:

* Use "we" language and collaborative tone: "Let's figure this out together"
* Share practical insights: "Here's what actually works..."
* Include relatable examples: "We've all been there when..."
* Focus on business value: "This impacts your day-to-day efficiency"
* Ask engaging questions: "What manual process is eating your time?"
* Provide step-by-step solutions when appropriate
* Use conversational transitions and natural language patterns
* **Contradiction tolerance**: It's OK to say "usually" then provide an exception in the next sentence
* **Opinion stacking**: State an opinion, then immediately qualify or challenge it
* **False starts**: Begin a thought, then restart: "The best way to... actually, scratch that. Here's what really works:"
* **Tangential thoughts**: Include one brief tangent per 500 words that adds color but isn't essential
* **Inconsistent formatting**: Vary between "Step 1:" and "First," for lists — perfect consistency is robotic
* Replace vague numbers with specific ones: "7 minutes" not "several minutes"
* Use real brand names: "like Netflix did in 2019" not "like major streaming services"
* Include prices: "$47/month" not "affordable pricing"
* Name real places: "at a coffee shop in Austin" not "at a local establishment"
* Specify time: "last Tuesday around 3pm" not "recently"
* Use actual percentages: "73% of users" not "most users"
* Include personal details: "my cousin Sarah" not "someone I know"
* Start 30% of sections with emotional hooks: "You know that sinking feeling when..."
* Include frustration points: "Look, I get it. This stuff is confusing at first."
* Add celebration moments: "And when it finally clicks? Pure magic."
* Use empathy bridges: "If you're like me and struggled with..."
* Include vulnerability: "I'll admit, I completely botched this the first time"
* Add mild sarcasm/humor: "Because nothing says 'professional' like a spreadsheet from 1997"
* Express genuine enthusiasm: "Ok, this next part is actually pretty cool"

### Punctuation Personality:

* Use em dashes sparingly (1–2 per article max) — AI overuses them
* Multiple question marks occasionally: "Really??? That's the solution?"
* Ellipses for genuine pauses... not for drama
* Exclamation points in clusters (use 2–3 in one paragraph, then none for several)
* Semicolons rarely; when you do, make it count
* Parentheses for actual asides (not for every clarification)
* Mix period styles: some paragraphs with all periods, others with varied punctuation

### Natural Language Patterns:

* Use informal connectors: "Thing is...", "Here's the deal...", "Turns out...", "Funny enough..."
* Include personal asides: "I've noticed that...", "From what I've seen...", "In my experience..."
* Add thinking-out-loud moments: "Now, you might wonder...", "OK so here's where it gets interesting..."
* Use colloquialisms and everyday phrases: "a ton of", "pretty much", "kind of", "sort of", "basically"
* Include rhetorical questions that don't need answers: "Weird, right?", "Makes sense?", "See what I mean?"
* Break grammar rules occasionally: End sentences with prepositions when it sounds natural ("That's what it's for")
* Use specific numbers instead of vague descriptors: Say "7 ways" not "several ways", "takes 15 minutes" not "quick process"

### Cognitive Markers (Human Thought Patterns):

* **Self-interruption**: "The strategy works—well, mostly works—when you have the right team"
* **Mid-thought corrections**: "You need at least 10... actually, make that 15 minutes to see results"
* **Hedging naturally**: "probably", "I'd say", "seems like", "might be" instead of absolute statements
* **Memory references**: "I can't remember the exact number, but it was somewhere around..."
* **Processing pauses**: Use dashes, ellipses, and parentheticals to show thinking: "The thing is—and this took me forever to figure out—timing matters more than perfection"
* **Admission of uncertainty**: "I'm not 100% sure, but from what I've seen..."
* **Real-time realizations**: "Actually, now that I think about it..." or "Wait, here's a better example..."

### SEO Integration (Human-First Approach):

* Work keywords into natural conversation — if you wouldn't say it out loud, rewrite it
* Use keyword synonyms and related terms the way people actually search: "how to" instead of "methodology for"
* Focus on answering real questions people ask, not just hitting keyword density
* Include long-tail variations that mirror natural speech patterns
* Write meta descriptions like you're texting a friend about the article
* Use headers that promise specific value: "5 Minute Fix for [Problem]" not "Solutions for [Keyword]"
* **Question-Based Headers**: Use incomplete questions: "But what about..." instead of "What Are The Benefits Of..."
* **Contextual Keywords**: Bury keywords in stories: "I was researching [keyword] last Tuesday when I realized..."
* **Avoid Keyword Boundaries**: Never use keywords at the start/end of sentences consistently
* **LSI Through Stories**: Include related terms naturally through examples, not lists

### Citation and Source Management:

* Reference provided research answers and statistics with markdown links [descriptive text](source URL)
* Ensure diversity of sources across different sections
* Integrate quotes and statistics naturally within narrative flow using inline citations
* Maintain factual accuracy while making information accessible
* Use descriptive link text that adds context to the citation
</Instructions>

<Conclusions>
Your output will be a complete, publication-ready markdown blog article that:
* Delivers genuine value and actionable insights to readers
* Naturally incorporates SEO elements without compromising readability
* Maintains consistent tone aligned with provided voice guidelines
* Includes proper markdown citations with source URLs
* Features engaging, conversational writing that builds trust and authority
* Provides clear next steps or resources for reader engagement
* Adheres to specified word counts and structural requirements
* Contains no additional commentary, explanations, or supporting text
</Conclusions>

<Solutions>
* If content sounds too formal: Add contractions, break up long sentences, include a personal anecdote
* If AI detection is a concern: Read aloud and rewrite any section that sounds unnatural in conversation
* If transitions feel mechanical: Replace with conversational bridges like "Here's the thing though..." or "But wait, there's more to consider..."
* If examples feel generic: Use specific brands, real scenarios, or current events instead of hypotheticals
* If research data is insufficient: Request additional sources or clarification on specific statistics needed
* If word count requirements conflict with content depth: Prioritize value delivery and suggest section adjustments
* If tone guidelines seem unclear: Ask for specific examples of preferred writing style or voice
* If keyword integration feels forced: Focus on natural language first, then optimize semantically
* If citation sources lack diversity: Request additional research materials or alternative sources
* If technical topics require simplification: Break down complex concepts using analogies and everyday examples
* If CTA placement seems unnatural: Integrate product mentions within helpful context rather than forced promotional sections
* If a paragraph has 3+ sentences starting the same way, rewrite completely
* If using the same transition word twice in 500 words, find alternatives
* If all sentences in a paragraph are 10–20 words, force variation by halving one and doubling another
* If no contractions appear in 200 words, you're too formal — add 3–4 immediately
* If no questions appear in 400 words, add a rhetorical question
* If no personal pronouns (I, we, you) appear in 150 words, inject personality
</Solutions>
`

// ─── Content Writing Agent ────────────────────────────────────────────────────

/**
 * Model used for content writing.
 * x-ai/grok-4-fast: $0.20/M input, $0.50/M output via OpenRouter.
 * Falls back to FREE_MODELS chain if the model is unavailable.
 */
const WRITING_MODEL = 'x-ai/grok-4-fast'

/**
 * Build the ICP context block to inject into writer prompts.
 * Returns empty string if no ICP data available.
 */
function buildIcpBlock(icpContext?: Record<string, any>, competitorContext?: Record<string, any>): string {
  const parts: string[] = []

  if (icpContext && Object.keys(icpContext).length > 0) {
    const painPoints = icpContext.pain_points || icpContext.painPoints || []
    const goals = icpContext.goals || []
    const challenges = icpContext.challenges || []
    const audience = icpContext.target_audience || icpContext.audience || icpContext.description || ''

    if (audience) parts.push(`Target audience: ${audience}`)
    if (painPoints.length) parts.push(`Reader pain points:\n${painPoints.map((p: string) => `- ${p}`).join('\n')}`)
    if (goals.length) parts.push(`Reader goals:\n${goals.map((g: string) => `- ${g}`).join('\n')}`)
    if (challenges.length) parts.push(`Reader challenges:\n${challenges.map((c: string) => `- ${c}`).join('\n')}`)

    if (!audience && !painPoints.length && !goals.length && !challenges.length) {
      parts.push(`ICP context: ${JSON.stringify(icpContext)}`)
    }
  }

  if (competitorContext && Object.keys(competitorContext).length > 0) {
    parts.push(`Competitor landscape: ${JSON.stringify(competitorContext)}`)
  }

  return parts.length ? parts.join('\n\n') : ''
}

export async function runContentWritingAgent(
  input: ContentWritingAgentInput
): Promise<ContentWritingAgentOutput> {
  const startTime = Date.now();

  // FIX: Build ICP block once, inject into all position prompts
  const icpBlock = buildIcpBlock(
    input.organizationContext.icpContext,
    input.organizationContext.competitorContext
  )
  const icpSection = icpBlock
    ? `\nICP & audience context (use to tailor tone, examples, and pain points — do NOT name the org):\n${icpBlock}\n`
    : ''

  // Dedent helper: compute the exact leading whitespace prefix from the
  // first non-empty line and remove that exact prefix from other lines that
  // start with it. This preserves embedded pretty-printed blocks that use
  // different indentation characters (tabs/mixed spaces).
  const dedent = (s: string) => {
    const lines = s.split('\n')
    // trim leading/trailing blank lines
    while (lines.length && lines[0].trim() === '') lines.shift()
    while (lines.length && lines[lines.length - 1].trim() === '') lines.pop()

    // Determine the base indent prefix (exact whitespace string)
    let baseIndentPrefix: string | undefined
    for (const line of lines) {
      if (line.trim().length === 0) continue
      const match = line.match(/^\s*/)
      baseIndentPrefix = match ? match[0] : ''
      break
    }

    if (!baseIndentPrefix) return lines.join('\n')

    // Strip the exact baseIndentPrefix only from lines that start with it
    return lines
      .map(line => (line.startsWith(baseIndentPrefix!) ? line.slice(baseIndentPrefix!.length) : line))
      .join('\n')
  }

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
    Keyword density rule: Use the target keyword AT MOST ONCE in this section. Each semantic keyword may also appear AT MOST ONCE. Do not repeat any keyword phrase more than once regardless of variation.

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

    Product / ICP context (background only — NEVER name the company in the article text):
    Company: ${input.organizationContext.name}
    Description: ${input.organizationContext.description}
    ${icpSection}
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
    Keyword density rule: Use the target keyword AT MOST ONCE in this section. Each semantic keyword may also appear AT MOST ONCE. Do not repeat any keyword phrase more than once regardless of variation.

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

    Product / ICP context (background only — NEVER name the company in the article text):
    Company: ${input.organizationContext.name}
    Description: ${input.organizationContext.description}
    ${icpSection}
    Close the article with:
    - A clear, actionable conclusion (2–3 sentences max)
    ${input.generationConfig.add_cta
          ? `- One natural CTA encouraging readers to explore relevant next steps or professional guidance — do NOT name the organization or any specific company.`
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
    Keyword density rule: Use the target keyword AT MOST ONCE in this section. Each semantic keyword may also appear AT MOST ONCE. Do not repeat any keyword phrase more than once regardless of variation.

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

    Product / ICP context (background only — NEVER name the company in the article text):
    Company: ${input.organizationContext.name}
    Description: ${input.organizationContext.description}
    ${icpSection}
    ${(input.researchPayload.results ?? []).flatMap(r => r.source_urls ?? []).filter(Boolean).length === 0
          ? 'No verified URLs are available for this section. Do NOT write any markdown links or parenthetical citations. Write prose only.'
          : 'Only link to URLs explicitly present in the Supporting research block above.'}`;
    }

    userMessage = dedent(userMessage).trim();

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
