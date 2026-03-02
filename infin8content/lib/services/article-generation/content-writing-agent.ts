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
• Include diverse, properly cited sources from provided research materials using markdown links
• Maintain the specified word count for each article section (±20% tolerance)
• Use markdown formatting with tables, bullet points, and proper headers
• Keep tone conversational and engaging, not overly serious or corporate
• Include natural calls-to-action and product/service mentions where contextually appropriate
• Embed YouTube video links when referencing video content (for later embedding)
• Output only the complete article with no additional commentary or supporting text

Inputs
You will receive structured article briefs containing:
• Article title and target keyword
• Content style (informative, educational, comparative, etc.)
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
4. Write the introduction that hooks readers with relatable problems or compelling
5. Develop each section following the provided structure while weaving in supporting points and research naturally  
6. Incorporate citations using markdown links [descriptive text](source URL) from the research materials  
7. Add tables or structured data where appropriate to enhance readability and value  
8. Include natural CTAs that guide readers toward relevant next steps or resources  
9. Review for SEO optimization ensuring target and semantic keywords appear naturally throughout  
10. Final polish for tone consistency, readability, and flow  

Writing Style Guidelines:
• Use “we” language and collaborative tone: “Let’s figure this out together”  
• Share practical insights: “Here’s what actually works…”  
• Include relatable examples: “We’ve all been there when…”  
• Focus on business value: “This impacts your day-to-day efficiency”  
• Ask engaging questions: “What manual process is eating your time?”  
• Provide step-by-step solutions when appropriate  
• Use conversational transitions and natural language patterns  

SEO Integration:
• Include target keyword in H1 title naturally  
• Use semantic keywords in H2 and H3 headers where relevant  
• Distribute keyword variations throughout body content organically  
• Create descriptive, keyword-rich meta descriptions through compelling introductions  
• Use related terms and synonyms to build topical authority  

Citation and Source Management:
• Reference provided research answers and statistics with markdown links [descriptive text](source URL)  
• Ensure diversity of sources across different sections  
• Integrate quotes and statistics naturally within narrative flow using inline citations  
• Maintain factual accuracy while making information accessible  
• Use descriptive link text that adds context to citation

Conclusions
Your output will be a complete, publication-ready markdown blog article that:
• Delivers genuine value and actionable insights to readers  
• Naturally incorporates SEO elements without compromising readability  
• Maintains consistent tone aligned with provided voice guidelines  
• Includes proper markdown citations with source URLs  
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

export async function runContentWritingAgent(
  input: ContentWritingAgentInput
): Promise<ContentWritingAgentOutput> {
  const startTime = Date.now();

  try {
    let userMessage = '';

    if (input.position === 'first') {
      userMessage = `Article title:
${input.articlePlan.article_title}

Target keyword:
${input.articlePlan.target_keyword}

Content style:
${input.articlePlan.content_style}

Semantic keywords:
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
- Tone: ${input.generationConfig.tone}
- Language: ${input.generationConfig.language}
- Add emojis: ${input.generationConfig.add_emojis}
- Brand color: ${input.generationConfig.brand_color}
- Image style: ${input.generationConfig.image_style}`;
    } else if (input.position === 'final') {
      userMessage = `Full article draft so far:
${input.priorContentMarkdown || ''}

Final section header:
${input.sectionHeader}

Section type:
${input.sectionType}

Key points to cover:
${input.plannerOutput.supporting_points.join('\n')}

Supporting research:
${JSON.stringify(input.researchPayload, null, 2)}

Reminder — close the article with:
- A clear, actionable conclusion.
- A natural CTA aligned with: ${input.generationConfig.add_cta}
- No repetition of content already covered above.`;
    } else {
      userMessage = `Article so far (do not repeat, only continue):
${input.priorContentMarkdown || ''}

Current section header:
${input.sectionHeader}

Section type:
${input.sectionType}

Estimated word count:
${input.plannerOutput.estimated_words}

Key points to cover:
${input.plannerOutput.supporting_points.join('\n')}

Supporting research:
${JSON.stringify(input.researchPayload, null, 2)}`;
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

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Content writing timeout: 180 seconds exceeded')), 180000)
    });

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[WritingAgent] Attempt ${attempt}/3 using anthropic/claude-sonnet-4.5`)

        result = await Promise.race([
          generateContent(messages, {
            model: 'anthropic/claude-sonnet-4.5',
            maxTokens: 2000,
            temperature: 0.7
          }),
          timeoutPromise
        ]);

        if (timeoutId) clearTimeout(timeoutId);
        break;
      } catch (error) {
        lastError = error;
        console.warn(`[WritingAgent] Attempt ${attempt} failed:`, error);

        if (attempt < 3 && isRetryableError(error)) {
          const delayMs = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else {
          if (timeoutId) clearTimeout(timeoutId);
          break;
        }
      }
    }

    if (!result) {
      throw lastError || new Error('Content writing failed after all attempts');
    }

    const html = await convertMarkdownToHtml(result.content);
    const wordCount = countWords(result.content);

    return {
      markdown: result.content,
      html,
      wordCount
    };

  } catch (error) {
    console.error('[WritingAgent] Fatal error:', error);
    throw error;
  }
}

async function convertMarkdownToHtml(markdown: string): Promise<string> {
  const escapeHtml = (text: string): string => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  };

  let html = escapeHtml(markdown);

  html = html
    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  html = html
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const escapedCode = escapeHtml(code.trim());
      return `<pre><code class="language-${lang || ''}">${escapedCode}</code></pre>`;
    })
    .replace(/`([^`]+)`/g, '<code>$1</code>');

  html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
  if (html.includes('<li>')) {
    html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
  }

  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  if (html.includes('<li>') && !html.includes('<ul>')) {
    html = html.replace(/(<li>.*<\/li>)/g, '<ol>$1</ol>');
  }

  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  html = html
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');

  html = html.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');

  return html;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const retryablePatterns = [/timeout/i, /network/i, /rate limit/i, /500/, /502/, /503/, /504/];
    return retryablePatterns.some(pattern => pattern.test(error.message));
  }
  return true;
}
