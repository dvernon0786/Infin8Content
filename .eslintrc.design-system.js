module.exports = {
  // Design System Specific ESLint Configuration
  // Extended compliance checking for Infin8Content Design System
  
  extends: ['./.eslintrc.js'],
  plugins: ['design-system'],
  
  overrides: [
    {
      files: ['**/*.{ts,tsx,js,jsx}'],
      rules: {
        // Critical Design System Rules
        'no-hardcoded-colors': 'error',
        'no-inline-styles': 'error',
        'use-design-tokens': 'error',
        'no-custom-colors': 'error',
        'semantic-colors': 'warn',
        'spacing-tokens': 'warn',
        'typography-tokens': 'warn',
        
        // Standard rules that help with design system compliance
        'react/style-prop-object': 'error',
        'react/no-inline-styles': 'error',
        
        // Prevent hard-coded values
        'react/no-unknown-property': 'error',
        
        // Encourage semantic HTML and component reusability
        'react/jsx-no-literals': 'warn',
        'component-reusability': 'warn',
        'no-custom-animations': 'warn'
      }
    },
    {
      files: ['**/*.css', '**/*.scss'],
      rules: {
        'use-design-tokens': 'error',
        'semantic-colors': 'error',
        'no-hardcoded-colors': 'error'
      }
    }
  ],
  
  // Custom rule definitions for design system compliance
  rules: {
    'no-hardcoded-colors': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow hard-coded hex colors and RGB values'
        }
      },
      create(context) {
        return {
          Literal(node) {
            if (typeof node.value === 'string') {
              // Check for hex colors
              if (/^#[0-9A-Fa-f]{6}$/.test(node.value)) {
                context.report({
                  node,
                  message: `Hard-coded color found: ${node.value}. Use design tokens like var(--color-primary-blue) instead.`
                });
              }
              // Check for RGB colors
              if (/^rgb\(|rgba\(/.test(node.value)) {
                context.report({
                  node,
                  message: `Hard-coded RGB color found: ${node.value}. Use design tokens instead.`
                });
              }
            }
          }
        };
      }
    },
    
    'no-inline-styles': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow inline styles in JSX - use CSS classes or design tokens'
        }
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name === 'style') {
              context.report({
                node,
                message: 'Inline styles are not allowed. Use CSS classes or design tokens instead. Critical layouts may use inline styles as documented in CSS specificity crisis resolution.'
              });
            }
          }
        };
      }
    },
    
    'use-design-tokens': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Encourage use of design tokens over hard-coded values'
        }
      },
      create(context) {
        return {
          Property(node) {
            if (node.key && (
              node.key.name === 'style' || 
              node.key.value === 'style'
            )) {
              context.report({
                node,
                message: 'Consider using design tokens instead of inline styles. Refer to /docs/design-system/tokens/ for available tokens.'
              });
            }
          }
        };
      }
    },
    
    'no-custom-colors': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow introduction of new colors outside the design token system'
        }
      },
      create(context) {
        return {
          Literal(node) {
            if (typeof node.value === 'string') {
              // Check for potential new color definitions
              if (/^#[0-9A-Fa-f]{6}$/.test(node.value)) {
                const allowedColors = ['#217CEB', '#4A42CC', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];
                if (!allowedColors.includes(node.value.toUpperCase())) {
                  context.report({
                    node,
                    message: `Custom color detected: ${node.value}. Only use approved brand colors from design tokens.`
                  });
                }
              }
            }
          }
        };
      }
    },
    
    'semantic-colors': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Encourage use of semantic color tokens over literal color names'
        }
      },
      create(context) {
        return {
          Literal(node) {
            if (typeof node.value === 'string' && node.value.includes('color')) {
              if (node.value.includes('blue') || node.value.includes('red') || node.value.includes('green')) {
                context.report({
                  node,
                  message: 'Use semantic color tokens (text-primary, background-secondary, success, error) instead of literal color names.'
                });
              }
            }
          }
        };
      }
    },
    
    'spacing-tokens': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Encourage use of spacing tokens over arbitrary pixel values'
        }
      },
      create(context) {
        return {
          Literal(node) {
            if (typeof node.value === 'string') {
              // Check for arbitrary pixel values that aren't spacing tokens
              if (/^\d{1,2}px$/.test(node.value)) {
                const validSpacing = ['4px', '8px', '16px', '24px', '32px', '48px', '64px', '96px'];
                if (!validSpacing.includes(node.value)) {
                  context.report({
                    node,
                    message: `Arbitrary spacing found: ${node.value}. Use spacing tokens: var(--spacing-xs, --spacing-sm, --spacing-md, etc.)`
                  });
                }
              }
            }
          }
        };
      }
    },
    
    'typography-tokens': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Encourage use of typography tokens over arbitrary font sizes'
        }
      },
      create(context) {
        return {
          Literal(node) {
            if (typeof node.value === 'string') {
              // Check for arbitrary font sizes
              if (/^\d{1,2}px$/.test(node.value) && node.value.includes('font')) {
                context.report({
                  node,
                  message: `Arbitrary font size found: ${node.value}. Use typography tokens: var(--font-h1, --font-h2, --font-body, etc.)`
                });
              }
            }
          }
        };
      }
    },
    
    'component-reusability': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Encourage component reusability over one-off implementations'
        }
      },
      create(context) {
        return {
          JSXOpeningElement(node) {
            // Check for common patterns that should use existing components
            if (node.name.name === 'div' && node.attributes) {
              const hasButtonLikeProps = node.attributes.some(attr => 
                attr.name && (attr.name.name === 'onClick' || attr.name.name === 'onSubmit')
              );
              if (hasButtonLikeProps) {
                context.report({
                  node,
                  message: 'Button-like div detected. Use the Button component instead of creating one-off implementations.'
                });
              }
            }
          }
        };
      }
    },
    
    'no-custom-animations': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Discourage custom animations in favor of standard transitions'
        }
      },
      create(context) {
        return {
          Property(node) {
            if (node.key && (
              node.key.name === 'animation' || 
              node.key.name === '@keyframes'
            )) {
              context.report({
                node,
                message: 'Custom animations detected. Use standard CSS transitions and design token animations instead.'
              });
            }
          }
        };
      }
    }
  }
};
