import { describe, test, expect } from 'vitest';

describe('Brand Gradient Consistency Validation', () => {
  test('should use correct brand colors in gradient', () => {
    // Load CSS content to verify token definitions
    const fs = require('fs');
    const path = require('path');
    const cssPath = path.join(__dirname, '../app/globals.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    
    // Verify brand color tokens are defined
    expect(cssContent).toContain('--color-primary-blue: #217CEB');
    expect(cssContent).toContain('--color-primary-purple: #4A42CC');
    
    // Verify gradient token uses correct colors
    expect(cssContent).toContain('--gradient-brand: linear-gradient(90deg, #217CEB 0%, #4A42CC 100%)');
  });

  test('should not have any hard-coded gradients in components', () => {
    const fs = require('fs');
    const path = require('path');
    
    // Check component files for hard-coded gradients
    const componentFiles = [
      '../components/marketing/CTAButton.tsx',
      '../components/marketing/HeroSection.tsx'
    ];
    
    componentFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Should not contain hard-coded gradient values
      expect(content).not.toContain('linear-gradient(90deg, #217CEB');
      expect(content).not.toContain('#217CEB 0%, #4A42CC 100%');
      
      // Should use CSS variable for gradient (only for components that use gradients)
      if (file.includes('CTAButton') || file.includes('HeroSection')) {
        expect(content).toContain('var(--gradient-brand)');
      }
    });
  });

  test('should maintain gradient consistency in decorative elements', () => {
    const fs = require('fs');
    const path = require('path');
    const cssPath = path.join(__dirname, '../app/globals.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    
    // Verify gradient token is available for decorative elements
    expect(cssContent).toContain('--gradient-brand: linear-gradient(90deg, #217CEB 0%, #4A42CC 100%)');
    
    // Check HeroSection uses gradient token for decorative elements
    const heroSectionPath = path.join(__dirname, '../components/marketing/HeroSection.tsx');
    const heroContent = fs.readFileSync(heroSectionPath, 'utf-8');
    
    // Should use color tokens in gradients, not hard-coded values
    expect(heroContent).toContain('var(--color-primary-blue)');
    expect(heroContent).toContain('var(--color-primary-purple)');
    expect(heroContent).not.toContain('#217CEB');
    expect(heroContent).not.toContain('#4A42CC');
  });

  test('should maintain left-to-right gradient direction only', () => {
    const fs = require('fs');
    const path = require('path');
    const cssPath = path.join(__dirname, '../app/globals.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    
    // Verify gradient is left-to-right (90deg) only
    expect(cssContent).toContain('--gradient-brand: linear-gradient(90deg, #217CEB 0%, #4A42CC 100%)');
    
    // Should not contain other gradient directions
    expect(cssContent).not.toContain('linear-gradient(180deg');
    expect(cssContent).not.toContain('linear-gradient(270deg');
    expect(cssContent).not.toContain('linear-gradient(0deg');
    expect(cssContent).not.toContain('linear-gradient(to bottom');
    expect(cssContent).not.toContain('linear-gradient(to top');
  });
});
