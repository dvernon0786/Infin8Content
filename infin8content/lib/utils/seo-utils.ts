/**
 * SEO Utilities
 * Re-homed from legacy section-processor.ts to support SEO scoring and validation.
 */

/**
 * Calculate readability score (minimal implementation)
 */
export function calculateReadabilityScore(content: string): number {
    if (!content || content.trim().length === 0) return 0;

    const words = content.split(/\s+/).filter(w => w.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    if (words.length === 0 || sentences.length === 0) return 0;

    // Average sentence length
    const asl = words.length / sentences.length;

    // Minimal heuristic for grade level
    // This is a simplified proxy for Grade Level
    if (asl > 25) return 14;
    if (asl > 20) return 12;
    if (asl > 15) return 10;
    if (asl > 10) return 8;
    return 6;
}

/**
 * Validate content structure (heading hierarchy)
 */
export function validateContentStructure(content: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    const headings = Array.from(content.matchAll(/^#{1,6}\s+(.+)$/gm)).map(m => m[0].trim());

    if (headings.length === 0) {
        return { isValid: true, issues: [] };
    }

    let lastLevel = 0;
    const h1Count = headings.filter(h => h.startsWith('# ')).length;

    if (h1Count > 1) {
        issues.push('Multiple H1 headings found');
    }

    for (const heading of headings) {
        const level = heading.split(' ')[0].length;

        if (lastLevel > 0 && level > lastLevel + 1) {
            issues.push(`Skipped heading level: H${lastLevel} to H${level}`);
        }

        lastLevel = level;
    }

    return {
        isValid: issues.length === 0,
        issues
    };
}
