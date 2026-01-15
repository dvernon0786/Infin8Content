#!/usr/bin/env node

/**
 * Design Token Validator
 * 
 * Validates code for design system compliance including:
 * - Hard-coded colors
 * - Arbitrary spacing values
 * - Inline styles
 * - Custom animations
 * - Typography violations
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface Violation {
  type: 'hardcoded-color' | 'arbitrary-spacing' | 'inline-style' | 'custom-animation' | 'arbitrary-font-size';
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

interface ValidationResult {
  file: string;
  violations: Violation[];
  compliant: boolean;
  score: number;
}

interface ComplianceReport {
  timestamp: string;
  totalFiles: number;
  compliantFiles: number;
  nonCompliantFiles: number;
  totalViolations: number;
  violations: Violation[];
  score: number;
  summary: {
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    byFile: Record<string, number>;
  };
}

class DesignTokenValidator {
  private violations: Violation[] = [];
  private patterns = {
    hardcodedColors: /#[0-9A-Fa-f]{6}/g,
    arbitrarySpacing: /(padding|margin):\s*[0-9]+px/g,
    inlineStyles: /style={/g,
    customAnimations: /animation:\s*[\w-]+/g,
    arbitraryFontSizes: /font-size:\s*[0-9]+px/g
  };

  async validateFiles(pattern: string): Promise<ValidationResult[]> {
    const files = await glob(pattern, { ignore: '**/node_modules/**' });
    const results: ValidationResult[] = [];

    for (const file of files) {
      const result = await this.validateFile(file);
      results.push(result);
    }

    return results;
  }

  async validateFile(filePath: string): Promise<ValidationResult> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      this.violations = [];
      
      lines.forEach((line, index) => {
        this.checkHardcodedColors(line, index + 1, filePath);
        this.checkArbitrarySpacing(line, index + 1, filePath);
        this.checkInlineStyles(line, index + 1, filePath);
        this.checkCustomAnimations(line, index + 1, filePath);
        this.checkArbitraryFontSizes(line, index + 1, filePath);
      });

      const score = this.calculateScore();
      
      return {
        file: filePath,
        violations: [...this.violations],
        compliant: this.violations.length === 0,
        score
      };
    } catch (error) {
      console.error(`Error validating file ${filePath}:`, error);
      return {
        file: filePath,
        violations: [],
        compliant: false,
        score: 0
      };
    }
  }

  private checkHardcodedColors(line: string, lineNumber: number, filePath: string): void {
    const matches = line.match(this.patterns.hardcodedColors);
    if (matches) {
      matches.forEach(match => {
        const column = line.indexOf(match) + 1;
        this.violations.push({
          type: 'hardcoded-color',
          file: filePath,
          line: lineNumber,
          column,
          message: `Hard-coded color found: ${match}. Use design tokens instead.`,
          severity: 'error'
        });
      });
    }
  }

  private checkArbitrarySpacing(line: string, lineNumber: number, filePath: string): void {
    const matches = line.match(this.patterns.arbitrarySpacing);
    if (matches) {
      matches.forEach(match => {
        const column = line.indexOf(match) + 1;
        this.violations.push({
          type: 'arbitrary-spacing',
          file: filePath,
          line: lineNumber,
          column,
          message: `Arbitrary spacing found: ${match}. Use spacing tokens instead.`,
          severity: 'warning'
        });
      });
    }
  }

  private checkInlineStyles(line: string, lineNumber: number, filePath: string): void {
    const matches = line.match(this.patterns.inlineStyles);
    if (matches) {
      matches.forEach(match => {
        const column = line.indexOf(match) + 1;
        this.violations.push({
          type: 'inline-style',
          file: filePath,
          line: lineNumber,
          column,
          message: `Inline style found. Use CSS classes or design tokens instead.`,
          severity: 'error'
        });
      });
    }
  }

  private checkCustomAnimations(line: string, lineNumber: number, filePath: string): void {
    const matches = line.match(this.patterns.customAnimations);
    if (matches) {
      matches.forEach(match => {
        const column = line.indexOf(match) + 1;
        this.violations.push({
          type: 'custom-animation',
          file: filePath,
          line: lineNumber,
          column,
          message: `Custom animation found: ${match}. Use standard transitions.`,
          severity: 'warning'
        });
      });
    }
  }

  private checkArbitraryFontSizes(line: string, lineNumber: number, filePath: string): void {
    const matches = line.match(this.patterns.arbitraryFontSizes);
    if (matches) {
      matches.forEach(match => {
        const column = line.indexOf(match) + 1;
        this.violations.push({
          type: 'arbitrary-font-size',
          file: filePath,
          line: lineNumber,
          column,
          message: `Arbitrary font size found: ${match}. Use typography tokens instead.`,
          severity: 'warning'
        });
      });
    }
  }

  private calculateScore(): number {
    if (this.violations.length === 0) return 100;
    
    const errorWeight = 10;
    const warningWeight = 5;
    
    const errorCount = this.violations.filter(v => v.severity === 'error').length;
    const warningCount = this.violations.filter(v => v.severity === 'warning').length;
    
    const totalDeductions = (errorCount * errorWeight) + (warningCount * warningWeight);
    const score = Math.max(0, 100 - totalDeductions);
    
    return Math.round(score);
  }

  generateReport(results: ValidationResult[]): ComplianceReport {
    const totalFiles = results.length;
    const compliantFiles = results.filter(r => r.compliant).length;
    const nonCompliantFiles = totalFiles - compliantFiles;
    
    const allViolations = results.flatMap(r => r.violations);
    const totalViolations = allViolations.length;
    
    const summary = {
      byType: this.groupByType(allViolations),
      bySeverity: this.groupBySeverity(allViolations),
      byFile: this.groupByFile(allViolations)
    };
    
    const overallScore = results.length > 0 
      ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
      : 100;

    return {
      timestamp: new Date().toISOString(),
      totalFiles,
      compliantFiles,
      nonCompliantFiles,
      totalViolations,
      violations: allViolations,
      score: overallScore,
      summary
    };
  }

  private groupByType(violations: Violation[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    violations.forEach(v => {
      grouped[v.type] = (grouped[v.type] || 0) + 1;
    });
    return grouped;
  }

  private groupBySeverity(violations: Violation[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    violations.forEach(v => {
      grouped[v.severity] = (grouped[v.severity] || 0) + 1;
    });
    return grouped;
  }

  private groupByFile(violations: Violation[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    violations.forEach(v => {
      grouped[v.file] = (grouped[v.file] || 0) + 1;
    });
    return grouped;
  }

  saveReport(report: ComplianceReport, outputPath: string): void {
    const reportContent = this.formatReport(report);
    fs.writeFileSync(outputPath, reportContent);
  }

  private formatReport(report: ComplianceReport): string {
    return `
# Design System Compliance Report

**Generated:** ${new Date(report.timestamp).toLocaleString()}
**Overall Score:** ${report.score}%
**Files:** ${report.compliantFiles}/${report.totalFiles} compliant

## Summary
- **Total Files:** ${report.totalFiles}
- **Compliant Files:** ${report.compliantFiles}
- **Non-Compliant Files:** ${report.nonCompliantFiles}
- **Total Violations:** ${report.totalViolations}
- **Overall Score:** ${report.score}%

## Violations by Type
${Object.entries(report.summary.byType).map(([type, count]) => 
  `- **${type}:** ${count}`
).join('\n')}

## Violations by Severity
${Object.entries(report.summary.bySeverity).map(([severity, count]) => 
  `- **${severity}:** ${count}`
).join('\n')}

## Files with Most Violations
${Object.entries(report.summary.byFile)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10)
  .map(([file, count]) => 
    `- **${file}:** ${count} violations`
  ).join('\n')}

## Detailed Violations
${report.violations.slice(0, 50).map(v => 
  `### ${v.type} - ${v.severity.toUpperCase()}
- **File:** ${v.file}
- **Line:** ${v.line}
- **Message:** ${v.message}
`).join('\n')}

${report.violations.length > 50 ? `... and ${report.violations.length - 50} more violations` : ''}

## Recommendations

### High Priority (Errors)
1. **Fix Hard-coded Colors:** Replace all hex colors with design tokens
2. **Remove Inline Styles:** Use CSS classes or design tokens
3. **Update Typography:** Use typography tokens for font sizes

### Medium Priority (Warnings)
1. **Standardize Spacing:** Replace arbitrary spacing with tokens
2. **Simplify Animations:** Use standard transitions
3. **Consolidate Font Sizes:** Use typography scale

### Next Steps
1. Run automated fixes where possible
2. Manual review of complex violations
3. Update component documentation
4. Schedule compliance training

---
*Report generated by Design Token Validator*
    `.trim();
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const pattern = args[0] || 'src/**/*.{ts,tsx,js,jsx,css,scss}';
  const outputPath = args[1] || 'reports/design-system-compliance.md';

  console.log('🔍 Validating design system compliance...');
  console.log(`Pattern: ${pattern}`);
  
  const validator = new DesignTokenValidator();
  const results = await validator.validateFiles(pattern);
  const report = validator.generateReport(results);
  
  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  validator.saveReport(report, outputPath);
  
  console.log(`\n📊 Compliance Report Generated:`);
  console.log(`- Overall Score: ${report.score}%`);
  console.log(`- Files: ${report.compliantFiles}/${report.totalFiles} compliant`);
  console.log(`- Violations: ${report.totalViolations}`);
  console.log(`- Report saved to: ${outputPath}`);
  
  // Exit with error code if score is below threshold
  if (report.score < 80) {
    console.log('\n❌ Compliance score below 80%. Please fix violations.');
    process.exit(1);
  } else {
    console.log('\n✅ Compliance check passed!');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { DesignTokenValidator, ValidationResult, ComplianceReport, Violation };
