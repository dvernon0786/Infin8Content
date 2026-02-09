import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HeroSection from '@/components/marketing/HeroSection';
import FinalCTA from '@/components/marketing/FinalCTA';

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

  test('should render HeroSection component', () => {
    const heroContainer = render(<HeroSection />).container;
    
    // Should render the component
    expect(heroContainer.querySelector('section')).toBeTruthy();
    
    // Should have register link
    expect(heroContainer.querySelector('a[href="/register"]')).toBeTruthy();
    
    // Should have pricing link
    expect(heroContainer.querySelector('a[href="/pricing"]')).toBeTruthy();
  });

  test('should render FinalCTA component', () => {
    const finalContainer = render(<FinalCTA />).container;
    
    // Should render the component
    expect(finalContainer.querySelector('section')).toBeTruthy();
    
    // Should have register link
    expect(finalContainer.querySelector('a[href="/register"]')).toBeTruthy();
  });

  test('should have gradient token available in CSS', () => {
    const fs = require('fs');
    const path = require('path');
    const cssPath = path.join(__dirname, '../app/globals.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    
    // Verify gradient token is available
    expect(cssContent).toContain('--gradient-brand: linear-gradient(90deg, #217CEB 0%, #4A42CC 100%)');
    
    // Verify brand color tokens are defined
    expect(cssContent).toContain('--color-primary-blue: #217CEB');
    expect(cssContent).toContain('--color-primary-purple: #4A42CC');
  });
});
