import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runContentWritingAgent } from '@/lib/services/article-generation/content-writing-agent';
import { generateContent } from '@/lib/services/openrouter/openrouter-client';
import { CONTENT_WRITING_SYSTEM_PROMPT, CONTENT_WRITING_PROMPT_HASH } from '@/lib/llm/prompts/content-writing.prompt';
import { assertTemplateIntegrity, PromptIntegrityError } from '@/lib/llm/prompts/assert-prompt-integrity';

// Mock OpenRouter
vi.mock('@/lib/services/openrouter/openrouter-client');

describe('Content Writing Agent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockOrganizationDefaults = {
    tone: 'professional',
    language: 'en',
    internal_links: true,
    global_instructions: 'Be informative'
  };

  it('generates content with fixed system prompt', async () => {
    const mockGenerateContent = vi.mocked(generateContent);
    mockGenerateContent.mockResolvedValue({
      content: '# Test Section\nThis is test content.',
      tokensUsed: 100,
      modelUsed: 'gemini-2.5-flash',
      promptTokens: 50,
      completionTokens: 50
    });

    const input = {
      sectionHeader: 'Introduction',
      sectionType: 'introduction',
      researchPayload: { findings: ['Test finding'] },
      priorSections: [],
      organizationDefaults: mockOrganizationDefaults
    };

    const result = await runContentWritingAgent(input);

    expect(result.markdown).toBe('# Test Section\nThis is test content.');
    expect(result.html).toBeTruthy();
    expect(result.wordCount).toBeGreaterThan(0);
    
    // Verify system prompt usage
    const call = mockGenerateContent.mock.calls[0][0];
    expect(call).toBeDefined();
    expect(Array.isArray(call)).toBe(true);
    expect(call[0].role).toBe('system');
    expect(call[0].content).toContain('You are a content writer');
  });

  it('includes prior sections in context', async () => {
    const mockGenerateContent = vi.mocked(generateContent);
    mockGenerateContent.mockResolvedValue({
      content: 'New section content',
      tokensUsed: 100,
      modelUsed: 'gemini-2.5-flash',
      promptTokens: 50,
      completionTokens: 50
    });

    const input = {
      sectionHeader: 'Section 2',
      sectionType: 'h2',
      researchPayload: {},
      priorSections: [
        {
          id: '1',
          section_header: 'Section 1',
          content_markdown: 'Previous content',
          status: 'completed',
          section_order: 1
        }
      ],
      organizationDefaults: mockOrganizationDefaults
    };

    await runContentWritingAgent(input);

    const call = mockGenerateContent.mock.calls[0][0];
    expect(call).toBeDefined();
    expect(Array.isArray(call)).toBe(true);
    expect(call[0].content).toContain('Previous content');
  });

  it('throws if content writing system prompt is modified', () => {
    const mutatedPrompt = CONTENT_WRITING_SYSTEM_PROMPT + ' ';
    expect(() =>
      assertTemplateIntegrity(
        mutatedPrompt,
        CONTENT_WRITING_PROMPT_HASH,
        'ContentWritingAgent'
      )
    ).toThrow(PromptIntegrityError);
  });

  it('converts markdown to HTML and counts words', async () => {
    const mockGenerateContent = vi.mocked(generateContent);
    mockGenerateContent.mockResolvedValue({
      content: '# Test Section\nThis is test content with multiple words.',
      tokensUsed: 100,
      modelUsed: 'gemini-2.5-flash',
      promptTokens: 50,
      completionTokens: 50
    });

    const input = {
      sectionHeader: 'Test',
      sectionType: 'h1',
      researchPayload: {},
      priorSections: [],
      organizationDefaults: mockOrganizationDefaults
    };

    const result = await runContentWritingAgent(input);

    expect(result.html).toContain('<h1>Test Section</h1>');
    expect(result.wordCount).toBeGreaterThan(5);
  });

  it('handles OpenRouter API failures with retry logic', async () => {
    const mockGenerateContent = vi.mocked(generateContent);
    mockGenerateContent.mockRejectedValue(new Error('API Error'));

    const input = {
      sectionHeader: 'Test',
      sectionType: 'h1',
      researchPayload: {},
      priorSections: [],
      organizationDefaults: mockOrganizationDefaults
    };

    await expect(runContentWritingAgent(input)).rejects.toThrow('API Error');
    expect(mockGenerateContent).toHaveBeenCalledTimes(3); // 3 retry attempts
  }, 10000); // 10 second timeout
});
