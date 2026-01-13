import { describe, test, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Design Tokens Validation', () => {
  let cssContent: string;

  beforeEach(() => {
    // Load the CSS file content for validation
    const cssPath = join(__dirname, '../app/globals.css');
    cssContent = readFileSync(cssPath, 'utf-8');
  });

  describe('Color Tokens', () => {
    test('should define brand color tokens', () => {
      expect(cssContent).toContain('--color-primary-blue: #217CEB');
      expect(cssContent).toContain('--color-primary-purple: #4A42CC');
      expect(cssContent).toContain('--gradient-brand: linear-gradient(90deg, #217CEB 0%, #4A42CC 100%)');
    });

    test('should define semantic color tokens', () => {
      expect(cssContent).toContain('--color-text-primary: #2C2C2E');
      expect(cssContent).toContain('--color-text-secondary: #6B7280');
      expect(cssContent).toContain('--color-text-muted: #9CA3AF');
      expect(cssContent).toContain('--color-background-primary: #FFFFFF');
      expect(cssContent).toContain('--color-background-secondary: #F4F4F6');
      expect(cssContent).toContain('--color-background-accent: #F9FAFB');
      expect(cssContent).toContain('--color-border-light: #E5E7EB');
      expect(cssContent).toContain('--color-border-medium: #D1D5DB');
    });

    test('should define status color tokens', () => {
      expect(cssContent).toContain('--color-success: #10B981');
      expect(cssContent).toContain('--color-warning: #F59E0B');
      expect(cssContent).toContain('--color-error: #EF4444');
      expect(cssContent).toContain('--color-info: #3B82F6');
    });
  });

  describe('Spacing Tokens', () => {
    test('should define spacing scale tokens', () => {
      expect(cssContent).toContain('--spacing-xs: 4px');
      expect(cssContent).toContain('--spacing-sm: 8px');
      expect(cssContent).toContain('--spacing-md: 16px');
      expect(cssContent).toContain('--spacing-lg: 24px');
      expect(cssContent).toContain('--spacing-xl: 32px');
      expect(cssContent).toContain('--spacing-2xl: 48px');
      expect(cssContent).toContain('--spacing-3xl: 64px');
      expect(cssContent).toContain('--spacing-4xl: 96px');
    });
  });

  describe('Typography Tokens', () => {
    test('should define font size tokens', () => {
      expect(cssContent).toContain('--font-h1: 48px');
      expect(cssContent).toContain('--font-h2: 36px');
      expect(cssContent).toContain('--font-h3: 28px');
      expect(cssContent).toContain('--font-h4: 22px');
      expect(cssContent).toContain('--font-body: 16px');
      expect(cssContent).toContain('--font-small: 14px');
      expect(cssContent).toContain('--font-caption: 12px');
      expect(cssContent).toContain('--font-label: 13px');
    });

    test('should define font weight tokens', () => {
      expect(cssContent).toContain('--font-weight-light: 300');
      expect(cssContent).toContain('--font-weight-normal: 400');
      expect(cssContent).toContain('--font-weight-medium: 500');
      expect(cssContent).toContain('--font-weight-semibold: 600');
      expect(cssContent).toContain('--font-weight-bold: 700');
    });
  });

  describe('Border Radius Tokens', () => {
    test('should define radius scale tokens', () => {
      expect(cssContent).toContain('--radius-xs: 2px');
      expect(cssContent).toContain('--radius-sm: 4px');
      expect(cssContent).toContain('--radius-md: 8px');
      expect(cssContent).toContain('--radius-lg: 12px');
      expect(cssContent).toContain('--radius-xl: 16px');
      expect(cssContent).toContain('--radius-2xl: 20px');
      expect(cssContent).toContain('--radius-3xl: 24px');
      expect(cssContent).toContain('--radius-4xl: 28px');
      expect(cssContent).toContain('--radius-full: 9999px');
    });
  });

  describe('Shadow Tokens', () => {
    test('should define shadow system tokens', () => {
      expect(cssContent).toContain('--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)');
      expect(cssContent).toContain('--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)');
      expect(cssContent).toContain('--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)');
      expect(cssContent).toContain('--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)');
    });
  });

  describe('CSS Structure Validation', () => {
    test('should use @theme inline configuration', () => {
      expect(cssContent).toContain('@theme inline');
    });

    test('should maintain proper CSS structure', () => {
      expect(cssContent).toContain('@custom-variant dark (&:is(.dark *))');
      expect(cssContent).toContain('@layer base');
    });
  });

  describe('Token Organization', () => {
    test('should have proper token sections', () => {
      expect(cssContent).toContain('/* Brand Design System Tokens */');
      expect(cssContent).toContain('/* UX Spec Required Colors */');
      expect(cssContent).toContain('/* Spacing */');
      expect(cssContent).toContain('/* Typography - UX Spec Fixed Sizes */');
      expect(cssContent).toContain('/* Font Weights */');
      expect(cssContent).toContain('/* Border Radius - UX Spec Compliance */');
      expect(cssContent).toContain('/* Shadow System */');
    });
  });
});
