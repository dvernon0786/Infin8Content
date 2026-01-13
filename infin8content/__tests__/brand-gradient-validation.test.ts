import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CTAButton from '@/components/marketing/CTAButton';
import HeroSection from '@/components/marketing/HeroSection';

// Mock the CSS file for testing
vi.mock('../app/globals.css', () => ({
  globals: {}
}));

describe('Brand Gradient Consistency Validation', () => {
  beforeEach(() => {
    // Reset DOM before each test
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  test('should use consistent brand gradient across components', () => {
    const expectedGradient = 'linear-gradient(90deg, #217CEB 0%, #4A42CC 100%)';
    
    // Test CTAButton with brand variant
    const { container: ctaContainer } = render(
      <CTAButton>Test Button</CTAButton>
    );
    
    const ctaButton = ctaContainer.querySelector('button');
    const ctaStyles = getComputedStyle(ctaButton!);
    expect(ctaStyles.background).toBe(expectedGradient);
  });

  test('should maintain gradient direction (left to right only)', () => {
    const expectedGradient = 'linear-gradient(90deg, #217CEB 0%, #4A42CC 100%)';
    
    // Test HeroSection primary CTA
    const { container: heroContainer } = render(
      <HeroSection
        headline="Test Headline"
        subtext="Test Subtext"
        primaryCta={{ text: "Primary", href: "/test" }}
        secondaryCta={{ text: "Secondary", href: "/test" }}
        visualSrc="/test.jpg"
        visualAlt="Test Visual"
      />
    );
    
    const primaryButton = heroContainer.querySelector('a[href="/test"]');
    if (primaryButton) {
      const buttonStyles = getComputedStyle(primaryButton);
      expect(buttonStyles.background).toBe(expectedGradient);
    }
  });

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
      '../components/marketing/HeroSection.tsx',
      '../components/marketing/ProblemSolutionCard.tsx'
    ];
    
    componentFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Should not contain hard-coded gradient values
      expect(content).not.toContain('linear-gradient(90deg, #217CEB');
      expect(content).not.toContain('#217CEB 0%, #4A42CC 100%');
      
      // Should use CSS variable for gradient
      expect(content).toContain('var(--gradient-brand)');
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
});
