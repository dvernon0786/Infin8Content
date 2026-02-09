import { describe, it, expect, beforeEach } from 'vitest';
import { 
  assertPromptIntegrity, 
  assertNoUnresolvedPlaceholders,
  PromptIntegrityError,
  hashPrompt 
} from '@/lib/llm/prompts/assert-prompt-integrity';

describe('Prompt Integrity System', () => {
  const originalPrompt = 'You are a content writer. Your task is to write the following section.';
  const originalHash = hashPrompt(originalPrompt);

  beforeEach(() => {
    // Reset any state if needed
  });

  it('should pass template integrity check for unchanged template', () => {
    expect(() => {
      assertPromptIntegrity(originalPrompt, originalHash, 'TestPrompt');
    }).not.toThrow();
  });

  it('should throw PromptIntegrityError for modified template', () => {
    const modifiedPrompt = originalPrompt + ' Modified content';
    
    expect(() => {
      assertPromptIntegrity(modifiedPrompt, originalHash, 'TestPrompt');
    }).toThrow(PromptIntegrityError);
  });

  it('should throw error with correct message and code', () => {
    const modifiedPrompt = originalPrompt + ' Modified';
    
    try {
      assertPromptIntegrity(modifiedPrompt, originalHash, 'TestPrompt');
      expect.fail('Expected PromptIntegrityError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(PromptIntegrityError);
      expect((error as PromptIntegrityError).code).toBe('PROMPT_MUTATION_DETECTED');
      expect((error as Error).message).toContain('TestPrompt system prompt template has been modified at runtime');
    }
  });

  it('should generate consistent SHA-256 hashes', () => {
    const hash1 = hashPrompt(originalPrompt);
    const hash2 = hashPrompt(originalPrompt);
    
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex format
  });

  it('should generate different hashes for different prompts', () => {
    const differentPrompt = 'You are a different writer with different instructions.';
    const differentHash = hashPrompt(differentPrompt);
    
    expect(differentHash).not.toBe(originalHash);
  });

  it('should detect unresolved placeholders in interpolated prompt', () => {
    const promptWithPlaceholders = 'You are a writer. Section: {section_header}. Type: {section_type}.';
    
    expect(() => {
      assertNoUnresolvedPlaceholders(promptWithPlaceholders);
    }).toThrow('Prompt interpolation incomplete: unresolved placeholders detected');
  });

  it('should pass when all placeholders are resolved', () => {
    const fullyInterpolatedPrompt = 'You are a writer. Section: Introduction. Type: h1. Research: findings here.';
    
    expect(() => {
      assertNoUnresolvedPlaceholders(fullyInterpolatedPrompt);
    }).not.toThrow();
  });

  it('should fail if interpolated system prompt contains unresolved placeholders', () => {
    // This test locks the actual execution path
    const CONTENT_WRITING_TEMPLATE = `
You are a content writer. Your task is to write the following section:

Section: {section_header}
Type: {section_type}

Research findings:
{research_results}

Prior sections (for context):
{prior_sections_markdown}

Organization guidelines:
- Tone: {tone}
- Language: {language}
- Include internal links: {internal_links}
- Global instructions: {global_instructions}

Write the section in markdown format:
1. Use clear, engaging language
2. Reference research findings
3. Maintain consistency with prior sections
4. Follow organization guidelines
5. No commentary or meta-text
`.trim();

    // Simulate full interpolation
    const systemPrompt = CONTENT_WRITING_TEMPLATE
      .replace('{section_header}', 'Introduction')
      .replace('{section_type}', 'h1')
      .replace('{research_results}', 'Key findings from research')
      .replace('{prior_sections_markdown}', '')
      .replace('{tone}', 'professional')
      .replace('{language}', 'en')
      .replace('{internal_links}', 'true')
      .replace('{global_instructions}', 'Be informative');

    // Should pass: all placeholders resolved
    expect(() => {
      assertNoUnresolvedPlaceholders(systemPrompt);
    }).not.toThrow();

    // Should fail: missing one replacement
    const incompletePrompt = CONTENT_WRITING_TEMPLATE
      .replace('{section_header}', 'Introduction')
      .replace('{section_type}', 'h1')
      .replace('{research_results}', 'Key findings')
      // Missing all other replacements
      ;

    expect(() => {
      assertNoUnresolvedPlaceholders(incompletePrompt);
    }).toThrow('Prompt interpolation incomplete');
  });
});
