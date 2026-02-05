import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runContentWritingAgent } from '../../../../lib/services/article-generation/content-writing-agent';
import { generateContent } from '../../../../lib/services/openrouter/openrouter-client';
import { CONTENT_WRITING_SYSTEM_PROMPT, CONTENT_WRITING_PROMPT_HASH } from '../../../../lib/llm/prompts/content-writing.prompt';
import { assertPromptIntegrity, PromptIntegrityError, assertNoUnresolvedPlaceholders } from '../../../../lib/llm/prompts/assert-prompt-integrity';

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
      assertPromptIntegrity(
        mutatedPrompt,
        CONTENT_WRITING_PROMPT_HASH,
        'ContentWritingAgent'
      )
    ).toThrow(PromptIntegrityError);
  });

  it('throws if unresolved placeholders remain in prompt', () => {
    const promptWithPlaceholders = 'Section: {section_header}\nType: {section_type}';
    expect(() =>
      assertNoUnresolvedPlaceholders(promptWithPlaceholders)
    ).toThrow('unresolved placeholders detected');
  });

  it('enforces 60-second timeout', async () => {
    const mockGenerateContent = vi.mocked(generateContent);
    // Mock a very slow response
    mockGenerateContent.mockImplementation(() => new Promise(() => {}));

    const input = {
      sectionHeader: 'Test',
      sectionType: 'h1',
      researchPayload: {},
      priorSections: [],
      organizationDefaults: mockOrganizationDefaults
    };

    const start = Date.now();
    await expect(runContentWritingAgent(input)).rejects.toThrow('60 seconds exceeded');
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(65000); // Should timeout around 60 seconds
  }, 70000);

  it('properly converts markdown to HTML', async () => {
    const mockGenerateContent = vi.mocked(generateContent);
    mockGenerateContent.mockResolvedValue({
      content: '# Test Section\n\nThis is **bold** text and *italic* text.\n\n- Item 1\n- Item 2\n\n`code snippet`',
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
    expect(result.html).toContain('<strong>bold</strong>');
    expect(result.html).toContain('<em>italic</em>');
    expect(result.html).toContain('<code>code snippet</code>');
  });

  it('handles empty research payload gracefully', async () => {
    const mockGenerateContent = vi.mocked(generateContent);
    mockGenerateContent.mockResolvedValue({
      content: 'Test content',
      tokensUsed: 50,
      modelUsed: 'gemini-2.5-flash',
      promptTokens: 25,
      completionTokens: 25
    });

    const input = {
      sectionHeader: 'Test',
      sectionType: 'h1',
      researchPayload: {},
      priorSections: [],
      organizationDefaults: mockOrganizationDefaults
    };

    const result = await runContentWritingAgent(input);
    expect(result.markdown).toBe('Test content');
  });

  it('uses exponential backoff for retries', async () => {
    const mockGenerateContent = vi.mocked(generateContent);
    let callCount = 0;
    
    mockGenerateContent.mockImplementation(() => {
      callCount++;
      if (callCount < 3) {
        return Promise.reject(new Error('Temporary failure'));
      }
      return Promise.resolve({
        content: 'Success after retries',
        tokensUsed: 50,
        modelUsed: 'gemini-2.5-flash',
        promptTokens: 25,
        completionTokens: 25
      });
    });

    const input = {
      sectionHeader: 'Test',
      sectionType: 'h1',
      researchPayload: {},
      priorSections: [],
      organizationDefaults: mockOrganizationDefaults
    };

    const start = Date.now();
    const result = await runContentWritingAgent(input);
    const duration = Date.now() - start;

    expect(result.markdown).toBe('Success after retries');
    expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    expect(duration).toBeGreaterThan(2000); // Should have waited for retries
  }, 10000);

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
