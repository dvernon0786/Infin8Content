import { describe, it, expect } from 'vitest'

// Simple CSS token verification test
describe('Component Library CSS Tokens', () => {
  it('should have design tokens defined in globals.css', () => {
    // Read the globals.css file and verify design tokens
    const fs = require('fs')
    const path = require('path')
    
    const globalsCssPath = path.join(__dirname, '../app/globals.css')
    const cssContent = fs.readFileSync(globalsCssPath, 'utf8')
    
    // Check for primary design tokens
    expect(cssContent).toContain('--color-primary-blue: #217CEB')
    expect(cssContent).toContain('--color-primary-purple: #4A42CC')
    expect(cssContent).toContain('--gradient-brand: linear-gradient(90deg, #217CEB 0%, #4A42CC 100%)')
    
    // Check for semantic colors
    expect(cssContent).toContain('--color-success: #10B981')
    expect(cssContent).toContain('--color-warning: #F59E0B')
    expect(cssContent).toContain('--color-error: #EF4444')
    expect(cssContent).toContain('--color-info: #3B82F6')
  })

  it('should have component files with proper structure', () => {
    const fs = require('fs')
    const path = require('path')
    
    // Check Button component
    const buttonPath = path.join(__dirname, '../components/ui/button.tsx')
    expect(fs.existsSync(buttonPath)).toBe(true)
    
    const buttonContent = fs.readFileSync(buttonPath, 'utf8')
    expect(buttonContent).toContain('primary')
    expect(buttonContent).toContain('secondary')
    expect(buttonContent).toContain('ghost')
    expect(buttonContent).toContain('destructive')
    expect(buttonContent).toContain('bg-[--color-primary-blue]')
    expect(buttonContent).toContain('bg-[--color-primary-purple]')
    
    // Check Badge component
    const badgePath = path.join(__dirname, '../components/ui/badge.tsx')
    expect(fs.existsSync(badgePath)).toBe(true)
    
    const badgeContent = fs.readFileSync(badgePath, 'utf8')
    expect(badgeContent).toContain('success')
    expect(badgeContent).toContain('warning')
    expect(badgeContent).toContain('error')
    expect(badgeContent).toContain('info')
    expect(badgeContent).toContain('brand')
    expect(badgeContent).toContain('bg-[--color-success]')
    expect(badgeContent).toContain('bg-[--color-warning]')
    expect(badgeContent).toContain('bg-[--color-error]')
    expect(badgeContent).toContain('bg-[--color-info]')
    
    // Check Progress component
    const progressPath = path.join(__dirname, '../components/ui/progress.tsx')
    expect(fs.existsSync(progressPath)).toBe(true)
    
    const progressContent = fs.readFileSync(progressPath, 'utf8')
    expect(progressContent).toContain('brand')
    expect(progressContent).toContain('bg-[--gradient-brand]')
    expect(progressContent).toContain('showLabel')
  })

  it('should have custom components with proper structure', () => {
    const fs = require('fs')
    const path = require('path')
    
    // Check ProgressBar component
    const progressBarPath = path.join(__dirname, '../components/custom/progress-bar.tsx')
    expect(fs.existsSync(progressBarPath)).toBe(true)
    
    const progressBarContent = fs.readFileSync(progressBarPath, 'utf8')
    expect(progressBarContent).toContain('ProgressBar')
    expect(progressBarContent).toContain('bg-[--gradient-brand]')
    expect(progressBarContent).toContain('aria-valuenow')
    expect(progressBarContent).toContain('role="progressbar"')
    
    // Check SectionProgress component
    const sectionProgressPath = path.join(__dirname, '../components/custom/section-progress.tsx')
    expect(fs.existsSync(sectionProgressPath)).toBe(true)
    
    const sectionProgressContent = fs.readFileSync(sectionProgressPath, 'utf8')
    expect(sectionProgressContent).toContain('SectionProgress')
    expect(sectionProgressContent).toContain('Generating Section')
    expect(sectionProgressContent).toContain('aria-live')
    
    // Check ConfidenceBadge component
    const confidenceBadgePath = path.join(__dirname, '../components/custom/confidence-badge.tsx')
    expect(fs.existsSync(confidenceBadgePath)).toBe(true)
    
    const confidenceBadgeContent = fs.readFileSync(confidenceBadgePath, 'utf8')
    expect(confidenceBadgeContent).toContain('ConfidenceBadge')
    expect(confidenceBadgeContent).toContain('high')
    expect(confidenceBadgeContent).toContain('medium')
    expect(confidenceBadgeContent).toContain('low')
    expect(confidenceBadgeContent).toContain('veryLow')
    
    // Check ArticleStateBadge component
    const articleStateBadgePath = path.join(__dirname, '../components/custom/article-state-badge.tsx')
    expect(fs.existsSync(articleStateBadgePath)).toBe(true)
    
    const articleStateBadgeContent = fs.readFileSync(articleStateBadgePath, 'utf8')
    expect(articleStateBadgeContent).toContain('ArticleStateBadge')
    expect(articleStateBadgeContent).toContain('draft')
    expect(articleStateBadgeContent).toContain('inReview')
    expect(articleStateBadgeContent).toContain('approved')
    expect(articleStateBadgeContent).toContain('published')
  })

  it('should have test files for all components', () => {
    const fs = require('fs')
    const path = require('path')
    
    // Check test files exist
    const buttonTestPath = path.join(__dirname, '../__tests__/components/ui/button.test.tsx')
    expect(fs.existsSync(buttonTestPath)).toBe(true)
    
    const progressBarTestPath = path.join(__dirname, '../__tests__/components/custom/progress-bar.test.tsx')
    expect(fs.existsSync(progressBarTestPath)).toBe(true)
    
    const sectionProgressTestPath = path.join(__dirname, '../__tests__/components/custom/section-progress.test.tsx')
    expect(fs.existsSync(sectionProgressTestPath)).toBe(true)
    
    const confidenceBadgeTestPath = path.join(__dirname, '../__tests__/components/custom/confidence-badge.test.tsx')
    expect(fs.existsSync(confidenceBadgeTestPath)).toBe(true)
    
    const articleStateBadgeTestPath = path.join(__dirname, '../__tests__/components/custom/article-state-badge.test.tsx')
    expect(fs.existsSync(articleStateBadgeTestPath)).toBe(true)
  })

  it('should have documentation files', () => {
    const fs = require('fs')
    const path = require('path')
    
    // Check documentation files exist
    const readmePath = path.join(__dirname, '../components/README.md')
    expect(fs.existsSync(readmePath)).toBe(true)
    
    const patternsPath = path.join(__dirname, '../components/PATTERNS.md')
    expect(fs.existsSync(patternsPath)).toBe(true)
    
    const migrationPath = path.join(__dirname, '../components/MIGRATION_GUIDE.md')
    expect(fs.existsSync(migrationPath)).toBe(true)
    
    // Check README content
    const readmeContent = fs.readFileSync(readmePath, 'utf8')
    expect(readmeContent).toContain('Component Library')
    expect(readmeContent).toContain('Button Component')
    expect(readmeContent).toContain('Badge Component')
    expect(readmeContent).toContain('Progress Components')
    expect(readmeContent).toContain('Design Token Integration')
  })

  it('should have Storybook configuration', () => {
    const fs = require('fs')
    const path = require('path')
    
    // Check Storybook configuration
    const storybookMainPath = path.join(__dirname, '../.storybook/main.ts')
    expect(fs.existsSync(storybookMainPath)).toBe(true)
    
    const storybookPreviewPath = path.join(__dirname, '../.storybook/preview.ts')
    expect(fs.existsSync(storybookPreviewPath)).toBe(true)
    
    // Check Storybook stories
    const buttonStoriesPath = path.join(__dirname, '../.storybook/stories/Button.stories.ts')
    expect(fs.existsSync(buttonStoriesPath)).toBe(true)
    
    const badgeStoriesPath = path.join(__dirname, '../.storybook/stories/Badge.stories.ts')
    expect(fs.existsSync(badgeStoriesPath)).toBe(true)
  })

  it('should have component styles utility', () => {
    const fs = require('fs')
    const path = require('path')
    
    const componentStylesPath = path.join(__dirname, '../components/lib/component-styles.ts')
    expect(fs.existsSync(componentStylesPath)).toBe(true)
    
    const componentStylesContent = fs.readFileSync(componentStylesPath, 'utf8')
    expect(componentStylesContent).toContain('designTokens')
    expect(componentStylesContent).toContain('confidenceLevels')
    expect(componentStylesContent).toContain('articleStates')
    expect(componentStylesContent).toContain('buttonVariants')
    expect(componentStylesContent).toContain('badgeVariants')
  })
})
