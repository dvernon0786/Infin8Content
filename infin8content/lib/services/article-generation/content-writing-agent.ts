import {
  CONTENT_WRITING_SYSTEM_PROMPT,
  CONTENT_WRITING_PROMPT_HASH
} from '@/lib/llm/prompts/content-writing.prompt';
import { assertPromptIntegrity, assertNoUnresolvedPlaceholders } from '@/lib/llm/prompts/assert-prompt-integrity';
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
  assertPromptIntegrity(
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
    
    // Create timeout promise (60 seconds)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Content writing timeout: 60 seconds exceeded')), 60000)
    });
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Content writing attempt ${attempt}/3`);
        
        // Race between generation and timeout
        result = await Promise.race([
          generateContent(messages, {
            maxTokens: 2000,
            temperature: 0.7,
            model: 'perplexity/sonar'
          }),
          timeoutPromise
        ]);
        
        console.log(`Content writing succeeded on attempt ${attempt}`);
        break; // Success
      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempt} failed:`, error);
        
        if (attempt < 3 && isRetryableError(error)) {
          const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`Retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else if (attempt === 3) {
          console.error('All retry attempts exhausted');
          break;
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
  // Escape HTML entities first
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
  
  // Process headers (must come before other patterns)
  html = html
    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  // Process code blocks (must come before inline code)
  html = html
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const escapedCode = escapeHtml(code.trim());
      return `<pre><code class="language-${lang || ''}">${escapedCode}</code></pre>`;
    })
    .replace(/`([^`]+)`/g, '<code>$1</code>');

  // Process lists
  const listItems = html.match(/^\* (.+)$/gm);
  if (listItems) {
    html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
  }
  
  const orderedListItems = html.match(/^\d+\. (.+)$/gm);
  if (orderedListItems) {
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/g, '<ol>$1</ol>');
  }

  // Process blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Process links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Process emphasis
  html = html
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/~~(.*?)~~/g, '<del>$1</del>');

  // Process line breaks and paragraphs
  html = html
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  // Wrap in paragraph tags if not already wrapped and not a block element
  if (!html.startsWith('<h') && !html.startsWith('<pre') && !html.startsWith('<ul') && !html.startsWith('<ol') && !html.startsWith('<blockquote')) {
    html = '<p>' + html + '</p>';
  }

  return html;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Retry on network errors, timeouts, and rate limiting
    const retryablePatterns = [
      /timeout/i,
      /network/i,
      /rate limit/i,
      /temporary/i,
      /connection/i,
      /ECONNRESET/i,
      /ETIMEDOUT/i
    ];
    
    return retryablePatterns.some(pattern => pattern.test(error.message));
  }
  // Retry on unknown errors by default
  return true;
}
