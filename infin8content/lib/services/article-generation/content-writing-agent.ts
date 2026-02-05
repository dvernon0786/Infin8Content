import {
  CONTENT_WRITING_SYSTEM_PROMPT,
  CONTENT_WRITING_PROMPT_HASH
} from '@/lib/llm/prompts/content-writing.prompt';
import { assertTemplateIntegrity, assertNoUnresolvedPlaceholders } from '@/lib/llm/prompts/assert-prompt-integrity';
import { generateContent, type OpenRouterMessage } from '@/lib/services/openrouter/openrouter-client';
import type { 
  ResearchPayload, 
  ArticleSection, 
  ContentWritingAgentInput, 
  ContentWritingAgentOutput,
  ContentDefaults 
} from '@/types/article';

export async function runContentWritingAgent(
  input: ContentWritingAgentInput
): Promise<ContentWritingAgentOutput> {
  // 🔒 Template integrity check (hash the canonical template)
  assertTemplateIntegrity(
    CONTENT_WRITING_SYSTEM_PROMPT,
    CONTENT_WRITING_PROMPT_HASH,
    'ContentWritingAgent'
  );

  const startTime = Date.now();
  
  try {
    // Build context from prior sections
    const priorSectionsMarkdown = input.priorSections
      .filter(section => section.status === 'completed')
      .sort((a, b) => a.section_order - b.section_order)
      .map(section => `## ${section.section_header}\n${section.content_markdown}`)
      .join('\n\n');

    // Build system prompt with variables
    const systemPrompt = CONTENT_WRITING_SYSTEM_PROMPT
      .replace('{section_header}', input.sectionHeader)
      .replace('{section_type}', input.sectionType)
      .replace('{research_results}', JSON.stringify(input.researchPayload, null, 2))
      .replace('{prior_sections_markdown}', priorSectionsMarkdown)
      .replace('{tone}', input.organizationDefaults.tone)
      .replace('{language}', input.organizationDefaults.language)
      .replace('{internal_links}', input.organizationDefaults.internal_links.toString())
      .replace('{global_instructions}', input.organizationDefaults.global_instructions);

    // 🔒 Runtime safety: verify all placeholders were resolved
    assertNoUnresolvedPlaceholders(systemPrompt);

    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: 'Write the section content now.'
      }
    ];

    // Safety check (defense in depth)
    if (messages[0]?.role !== 'system') {
      throw new Error('System prompt must be first message.');
    }

    // Call LLM with fixed prompt and retry logic
    let result;
    let lastError;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        result = await generateContent(messages, {
          maxTokens: 2000,
          temperature: 0.7,
          model: 'google/gemini-2.5-flash-exp'
        });
        break; // Success
      } catch (error) {
        lastError = error;
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000)); // 2s, 4s, 8s
        }
      }
    }

    if (!result) {
      throw lastError || new Error('Content generation failed after 3 attempts');
    }

    // Convert markdown to HTML
    const html = await convertMarkdownToHtml(result.content);
    const wordCount = countWords(result.content);

    // Performance metrics (simplified - no recording for now)
    const duration = Date.now() - startTime;
    console.log(`Content writing completed in ${duration}ms, ${wordCount} words`);

    return {
      markdown: result.content,
      html,
      wordCount
    };

  } catch (error) {
    console.error('Content writing error:', error);
    throw error;
  }
}

// Helper functions
async function convertMarkdownToHtml(markdown: string): Promise<string> {
  // Safe markdown to HTML conversion with XSS prevention
  // Escapes HTML entities first, then applies safe markdown patterns
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

  // First escape all HTML
  let html = escapeHtml(markdown);
  
  // Then apply safe markdown patterns (after escaping, these are safe)
  html = html
    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  // Wrap in paragraph tags if not already wrapped
  if (!html.startsWith('<p>')) {
    html = '<p>' + html + '</p>';
  }

  return html;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}
