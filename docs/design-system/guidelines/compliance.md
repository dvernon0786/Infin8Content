# Design System Compliance Guidelines

## Overview

Compliance guidelines ensure consistent implementation of the design system across all components and features. These rules are enforced through automated tools, code review processes, and team education.

## Compliance Requirements

### 1. Design Token Usage
All styling must use design tokens instead of hard-coded values.

#### ✅ Compliant
```css
.component {
  background-color: var(--color-background-primary);
  color: var(--color-text-primary);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}
```

#### ❌ Non-Compliant
```css
.component {
  background-color: #ffffff;
  color: #2c2c2e;
  padding: 16px;
  border-radius: 6px;
}
```

### 2. No Inline Styles
Components should not use inline styles for layout and styling.

#### ✅ Compliant
```tsx
const Button = ({ variant, size }) => {
  return (
    <button className={`btn btn-${variant} btn-${size}`}>
      Click me
    </button>
  );
};
```

#### ❌ Non-Compliant
```tsx
const Button = ({ variant, size }) => {
  return (
    <button style={{
      backgroundColor: '#217CEB',
      color: 'white',
      padding: '12px 24px'
    }}>
      Click me
    </button>
  );
};
```

### 3. Semantic Color Usage
Colors must follow semantic naming conventions.

#### ✅ Compliant
```css
.success-message {
  color: var(--color-success);
  background-color: var(--color-success);
  background-color: var(--color-success);
  opacity: 0.1;
}

.primary-action {
  background-color: var(--color-primary-blue);
  color: var(--color-background-primary);
}
```

#### ❌ Non-Compliant
```css
.success-message {
  color: #10B981;
  background-color: #10B981;
  opacity: 0.1;
}

.primary-action {
  background-color: #217CEB;
  color: white;
}
```

### 4. Component Reusability
Create reusable components instead of one-off implementations.

#### ✅ Compliant
```tsx
const Card = ({ title, children, actions }) => {
  return (
    <div className="card">
      {title && <h3>{title}</h3>}
      <div className="card-content">{children}</div>
      {actions && <div className="card-actions">{actions}</div>}
    </div>
  );
};
```

#### ❌ Non-Compliant
```tsx
const ArticleCard = ({ article }) => {
  return (
    <div className="article-card">
      <h3>{article.title}</h3>
      <p>{article.excerpt}</p>
      <button>Read More</button>
    </div>
  );
};

const ProductCard = ({ product }) => {
  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <button>Buy Now</button>
    </div>
  );
};
```

### 5. Standard Animations
Use standard transitions and avoid custom animations.

#### ✅ Compliant
```css
.button {
  transition: all 0.2s ease;
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

#### ❌ Non-Compliant
```css
.button {
  animation: custom-bounce 0.5s ease-in-out;
}

.button:hover {
  animation: custom-pulse 1s infinite;
}

@keyframes custom-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
```

## Automated Compliance Checking

### ESLint Rules
```javascript
module.exports = {
  rules: {
    // Design system compliance rules
    'design-system/no-hardcoded-colors': 'error',
    'design-system/use-design-tokens': 'error',
    'design-system/no-inline-styles': 'error',
    'design-system/no-custom-colors': 'error',
    'design-system/semantic-colors': 'warn',
    'design-system/spacing-tokens': 'warn',
    'design-system/typography-tokens': 'warn'
  }
};
```

### Pre-commit Hooks
```bash
#!/bin/bash
# .husky/pre-commit

echo "🔍 Running design system compliance checks..."

# Check for hard-coded colors
echo "Checking for hard-coded colors..."
if grep -r "#[0-9A-Fa-f]\{6\}" --include="*.tsx" --include="*.ts" --include="*.css" src/; then
  echo "❌ Hard-coded colors found. Use design tokens instead."
  exit 1
fi

# Check for inline styles
echo "Checking for inline styles..."
if grep -r "style={" --include="*.tsx" --include="*.ts" src/; then
  echo "❌ Inline styles found. Use CSS classes or design tokens."
  exit 1
fi

# Check for arbitrary spacing values
echo "Checking for arbitrary spacing values..."
if grep -r "padding: *[0-9]*px\|margin: *[0-9]*px" --include="*.css" --include="*.scss" src/; then
  echo "❌ Arbitrary spacing values found. Use spacing tokens."
  exit 1
fi

# Run design token validation
echo "Validating design token usage..."
npm run validate-design-tokens

echo "✅ All design system compliance checks passed!"
```

### CI/CD Pipeline
```yaml
# .github/workflows/design-system-compliance.yml
name: Design System Compliance

on: [push, pull_request]

jobs:
  design-system-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run design token validation
        run: npm run validate-design-tokens
      
      - name: Check for hard-coded values
        run: npm run lint:design-system
      
      - name: Generate compliance report
        run: npm run report:design-system
      
      - name: Upload compliance report
        uses: actions/upload-artifact@v3
        with:
          name: compliance-report
          path: reports/design-system/
```

## Compliance Validation Tools

### Design Token Validator
```typescript
// tools/validate-design-tokens.ts
import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  file: string;
  violations: Violation[];
  compliant: boolean;
}

interface Violation {
  type: 'hardcoded-color' | 'arbitrary-spacing' | 'inline-style' | 'custom-animation';
  line: number;
  column: number;
  message: string;
}

class DesignTokenValidator {
  private violations: Violation[] = [];
  
  validateFile(filePath: string): ValidationResult {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    this.violations = [];
    
    lines.forEach((line, index) => {
      this.checkHardcodedColors(line, index + 1);
      this.checkArbitrarySpacing(line, index + 1);
      this.checkInlineStyles(line, index + 1);
      this.checkCustomAnimations(line, index + 1);
    });
    
    return {
      file: filePath,
      violations: this.violations,
      compliant: this.violations.length === 0
    };
  }
  
  private checkHardcodedColors(line: string, lineNumber: number): void {
    const hexColorRegex = /#[0-9A-Fa-f]{6}/g;
    const matches = line.match(hexColorRegex);
    
    if (matches) {
      matches.forEach(match => {
        const column = line.indexOf(match) + 1;
        this.violations.push({
          type: 'hardcoded-color',
          line: lineNumber,
          column,
          message: `Hard-coded color found: ${match}. Use design tokens instead.`
        });
      });
    }
  }
  
  private checkArbitrarySpacing(line: string, lineNumber: number): void {
    const spacingRegex = /(padding|margin):\s*[0-9]+px/g;
    const matches = line.match(spacingRegex);
    
    if (matches) {
      matches.forEach(match => {
        const column = line.indexOf(match) + 1;
        this.violations.push({
          type: 'arbitrary-spacing',
          line: lineNumber,
          column,
          message: `Arbitrary spacing found: ${match}. Use spacing tokens instead.`
        });
      });
    }
  }
  
  private checkInlineStyles(line: string, lineNumber: number): void {
    const inlineStyleRegex = /style={/g;
    const matches = line.match(inlineStyleRegex);
    
    if (matches) {
      matches.forEach(match => {
        const column = line.indexOf(match) + 1;
        this.violations.push({
          type: 'inline-style',
          line: lineNumber,
          column,
          message: `Inline style found. Use CSS classes or design tokens instead.`
        });
      });
    }
  }
  
  private checkCustomAnimations(line: string, lineNumber: number): void {
    const customAnimationRegex = /animation:\s*[\w-]+/g;
    const matches = line.match(customAnimationRegex);
    
    if (matches) {
      matches.forEach(match => {
        const column = line.indexOf(match) + 1;
        this.violations.push({
          type: 'custom-animation',
          line: lineNumber,
          column,
          message: `Custom animation found: ${match}. Use standard transitions.`
        });
      });
    }
  }
}

// Usage
const validator = new DesignTokenValidator();
const result = validator.validateFile('src/components/Button.tsx');
console.log(result);
```

### Compliance Reporter
```typescript
// tools/compliance-reporter.ts
import * as fs from 'fs';
import * as path from 'path';

interface ComplianceReport {
  timestamp: string;
  totalFiles: number;
  compliantFiles: number;
  nonCompliantFiles: number;
  violations: ViolationSummary[];
  score: number;
}

interface ViolationSummary {
  type: string;
  count: number;
  files: string[];
}

class ComplianceReporter {
  generateReport(results: ValidationResult[]): ComplianceReport {
    const totalFiles = results.length;
    const compliantFiles = results.filter(r => r.compliant).length;
    const nonCompliantFiles = totalFiles - compliantFiles;
    
    const violations = this.summarizeViolations(results);
    const score = Math.round((compliantFiles / totalFiles) * 100);
    
    return {
      timestamp: new Date().toISOString(),
      totalFiles,
      compliantFiles,
      nonCompliantFiles,
      violations,
      score
    };
  }
  
  private summarizeViolations(results: ValidationResult[]): ViolationSummary[] {
    const violationMap = new Map<string, { count: number; files: Set<string> }>();
    
    results.forEach(result => {
      result.violations.forEach(violation => {
        const key = violation.type;
        const existing = violationMap.get(key) || { count: 0, files: new Set() };
        
        existing.count++;
        existing.files.add(result.file);
        
        violationMap.set(key, existing);
      });
    });
    
    return Array.from(violationMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      files: Array.from(data.files)
    }));
  }
  
  saveReport(report: ComplianceReport, outputPath: string): void {
    const reportContent = this.formatReport(report);
    fs.writeFileSync(outputPath, reportContent);
  }
  
  private formatReport(report: ComplianceReport): string {
    return `
# Design System Compliance Report

**Generated:** ${report.timestamp}
**Score:** ${report.score}%
**Files:** ${report.compliantFiles}/${report.totalFiles} compliant

## Summary
- Total Files: ${report.totalFiles}
- Compliant Files: ${report.compliantFiles}
- Non-Compliant Files: ${report.nonCompliantFiles}
- Overall Score: ${report.score}%

## Violations

${report.violations.map(violation => `
### ${violation.type}
- **Count:** ${violation.count}
- **Files:** ${violation.files.join(', ')}

`).join('')}

## Recommendations

1. **High Priority:** Fix hard-coded colors and inline styles
2. **Medium Priority:** Replace arbitrary spacing with tokens
3. **Low Priority:** Standardize animations and transitions

## Next Steps

1. Run automated fixes where possible
2. Manual review of complex violations
3. Update documentation with examples
4. Schedule compliance training for team

---
*Report generated by Design System Compliance Reporter*
    `.trim();
  }
}
```

## Review Process

### Code Review Checklist
```markdown
## Design System Compliance Review

### ✅ Token Usage
- [ ] No hard-coded colors (#hex values)
- [ ] No arbitrary spacing (px values)
- [ ] No custom font sizes
- [ ] No custom border radius
- [ ] All colors use semantic tokens

### ✅ Component Standards
- [ ] No inline styles
- [ ] Reusable components used
- [ ] Proper component composition
- [ ] Consistent naming conventions
- [ ] TypeScript interfaces defined

### ✅ Accessibility
- [ ] Semantic HTML elements
- [ ] ARIA attributes present
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility
- [ ] Color contrast compliance

### ✅ Performance
- [ ] Efficient CSS properties
- [ ] Optimized React rendering
- [ ] No unnecessary re-renders
- [ ] Proper memoization
- [ ] Bundle size considered

### ✅ Testing
- [ ] Unit tests written
- [ ] Accessibility tests pass
- [ ] Visual regression tests
- [ ] Performance tests
- [ ] Responsive design tests
```

### Pull Request Template
```markdown
## Design System Compliance

### Changes Made
- [ ] Updated components to use design tokens
- [ ] Removed hard-coded values
- [ ] Added accessibility improvements
- [ ] Updated tests

### Compliance Check
- [ ] ESLint rules pass
- [ ] Pre-commit hooks pass
- [ ] Manual review completed
- [ ] Tests pass

### Breaking Changes
- [ ] No breaking changes
- [ ] Breaking changes documented
- [ ] Migration guide updated

### Reviewers
- [ ] Design system review required
- [ ] Accessibility review required
- [ ] Performance review required
```

## Education and Training

### Onboarding Checklist
```markdown
## Design System Onboarding

### 📚 Required Reading
- [ ] Design System Overview
- [ ] Token Usage Guidelines
- [ ] Component Library Documentation
- [ ] Compliance Requirements
- [ ] Accessibility Standards

### 🛠️ Practical Exercises
- [ ] Create a component using design tokens
- [ ] Refactor existing component to be compliant
- [ ] Write tests for component compliance
- [ ] Use compliance validation tools
- [ ] Complete accessibility audit

### ✅ Assessment
- [ ] Token usage quiz
- [ ] Component creation exercise
- [ ] Compliance review practice
- [ ] Accessibility testing
- [ ] Final project review
```

### Training Materials
```typescript
// examples/compliance-examples.tsx

// ❌ Non-compliant examples
const NonCompliantButton = () => {
  return (
    <button
      style={{
        backgroundColor: '#217CEB',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '6px',
        border: 'none'
      }}
    >
      Non-Compliant Button
    </button>
  );
};

// ✅ Compliant examples
const CompliantButton = () => {
  return (
    <Button variant="primary" size="md">
      Compliant Button
    </Button>
  );
};

// ❌ Non-compliant card
const NonCompliantCard = ({ title, content }) => {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '24px',
      marginBottom: '16px'
    }}>
      <h3 style={{ color: '#2c2c2e', fontSize: '20px' }}>
        {title}
      </h3>
      <p style={{ color: '#6b7280', lineHeight: 1.6 }}>
        {content}
      </p>
    </div>
  );
};

// ✅ Compliant card
const CompliantCard = ({ title, content }) => {
  return (
    <Card title={title}>
      <p>{content}</p>
    </Card>
  );
};
```

## Enforcement

### Gradual Rollout Strategy
1. **Phase 1**: Education and awareness (2 weeks)
2. **Phase 2**: Warning-only enforcement (2 weeks)
3. **Phase 3**: Block non-compliant commits (2 weeks)
4. **Phase 4**: Full enforcement with exceptions process

### Exception Process
```markdown
## Compliance Exception Request

### Project/Component
- Name: [Component name]
- Owner: [Team member]
- Reason for exception: [Detailed explanation]

### Exception Details
- Specific rule(s) to bypass: [Rule names]
- Duration: [Time period]
- Impact assessment: [Effect on system]
- Mitigation plan: [How to address later]

### Approval Required
- [ ] Design system team lead
- [ ] Engineering manager
- [ ] Accessibility specialist
- [ ] Security team (if applicable)

### Review Timeline
- Request submitted: [Date]
- Review deadline: [Date]
- Decision: [Approved/Denied]
- Follow-up required: [Date]
```

## Monitoring and Reporting

### Metrics Dashboard
```typescript
interface ComplianceMetrics {
  overallScore: number;
  tokenCompliance: number;
  componentCompliance: number;
  accessibilityCompliance: number;
  performanceCompliance: number;
  trendData: TrendPoint[];
}

interface TrendPoint {
  date: string;
  score: number;
  violations: number;
  fixes: number;
}
```

### Weekly Reports
```markdown
## Design System Compliance Report

### Week of [Date]

#### 📊 Metrics
- **Overall Score:** 92% (+2% from last week)
- **Token Compliance:** 95% (+1%)
- **Component Compliance:** 89% (+3%)
- **Accessibility Compliance:** 94% (+1%)
- **Performance Compliance:** 90% (+2%)

#### 🎯 Highlights
- Fixed 15 hard-coded color violations
- Updated 8 components to use design tokens
- Improved accessibility scores by 1%

#### 📋 Issues
- 3 components still using inline styles
- 2 files with custom animations
- 1 accessibility issue in navigation

#### 🚀 Next Week Goals
- Reach 95% overall compliance
- Fix remaining inline style issues
- Complete accessibility audit
```

## Resources

### Tools and Scripts
- [Token Validator](../../../tools/validate-design-tokens.ts)
- [Compliance Reporter](../../../tools/compliance-reporter.ts)
- [ESLint Configuration](../../../.eslintrc.js)
- [Pre-commit Hooks](../../../.husky/pre-commit)

### Documentation
- [Design Token Reference](../tokens/)
- [Component Library](../components/)
- [Usage Guidelines](./usage.md)
- [Accessibility Standards](./accessibility.md)

### Support
- Design System Team: design-system@company.com
- Compliance Issues: compliance@company.com
- Training Requests: training@company.com

---

**Last Updated**: January 15, 2026  
**Version**: 1.0.0  
**Next Review**: March 15, 2026
