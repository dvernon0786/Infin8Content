import { hashPrompt } from './assert-prompt-integrity';

export const CONTENT_WRITING_SYSTEM_PROMPT = `
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

export const CONTENT_WRITING_PROMPT_HASH = hashPrompt(CONTENT_WRITING_SYSTEM_PROMPT);
