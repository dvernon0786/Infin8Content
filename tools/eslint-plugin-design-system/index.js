/**
 * Design System ESLint Plugin
 * 
 * Enforces design system compliance including:
 * - No hard-coded colors
 * - Design token usage
 * - No inline styles
 * - Semantic color usage
 * - Spacing token usage
 * - Typography token usage
 */

module.exports = {
  rules: {
    'no-hardcoded-colors': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow hard-coded hex colors in favor of design tokens',
          category: 'Best Practices',
          recommended: true
        }
      },
      create: function(context) {
        return {
          Literal(node) {
            // Check for hex color values
            if (typeof node.value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(node.value)) {
              context.report({
                node,
                message: `Hard-coded color found: ${node.value}. Use design tokens instead.`,
                suggest: [
                  {
                    desc: 'Replace with design token',
                    fix: null // Cannot auto-fix as token depends on context
                  }
                ]
              });
            }
          },
          TemplateElement(node) {
            // Check for hex colors in template literals
            node.value.quasis.forEach((quasi, index) => {
              const hexColors = quasi.value.raw.match(/#[0-9A-Fa-f]{6}/g);
              if (hexColors) {
                hexColors.forEach(color => {
                  context.report({
                    node,
                    loc: {
                      start: node.loc.start,
                      end: node.loc.end
                    },
                    message: `Hard-coded color found in template literal: ${color}. Use design tokens instead.`
                  });
                });
              }
            });
          }
        };
      }
    },

    'use-design-tokens': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Encourage use of design tokens for styling',
          category: 'Best Practices',
          recommended: true
        }
      },
      create: function(context) {
        return {
          Property(node) {
            // Check for style properties that should use tokens
            if (node.key.name === 'style') {
              context.report({
                node,
                message: 'Consider using design tokens instead of inline styles.',
                suggest: [
                  {
                    desc: 'Use CSS classes with design tokens',
                    fix: null
                  }
                ]
              });
            }
          }
        };
      }
    },

    'no-inline-styles': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow inline styles in favor of CSS classes or design tokens',
          category: 'Best Practices',
          recommended: true
        }
      },
      create: function(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name === 'style') {
              context.report({
                node,
                message: 'Inline styles are not allowed. Use CSS classes or design tokens instead.',
                suggest: [
                  {
                    desc: 'Replace with CSS class',
                    fix: null
                  }
                ]
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
          description: 'Disallow custom color definitions outside design tokens',
          category: 'Best Practices',
          recommended: true
        }
      },
      create: function(context) {
        return {
          Property(node) {
            // Check for custom color properties in CSS
            if (node.key && node.key.value && (
              node.key.value.includes('color') || 
              node.key.value.includes('background')
            )) {
              const value = node.value.value;
              if (value && !value.includes('var(--color-') && !value.includes('var(--gradient-')) {
                context.report({
                  node,
                  message: `Custom color found: ${value}. Use design tokens instead.`,
                  suggest: [
                    {
                      desc: 'Replace with design token',
                      fix: null
                    }
                  ]
                });
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
          description: 'Encourage use of semantic color tokens over literal colors',
          category: 'Best Practices',
          recommended: true
        }
      },
      create: function(context) {
        const semanticTokens = [
          'color-text-primary',
          'color-text-secondary', 
          'color-text-muted',
          'color-background-primary',
          'color-background-secondary',
          'color-background-accent',
          'color-border-light',
          'color-border-medium',
          'color-success',
          'color-warning',
          'color-error',
          'color-info'
        ];

        return {
          TemplateElement(node) {
            node.value.quasis.forEach((quasi) => {
              const tokens = quasi.value.raw.match(/var\(--color-[\w-]+\)/g);
              if (tokens) {
                tokens.forEach(token => {
                  const tokenName = token.match(/--color-([\w-]+)/)?.[1];
                  if (tokenName && !semanticTokens.some(semantic => token.includes(semantic))) {
                    context.report({
                      node,
                      message: `Consider using semantic color token instead of: ${token}`,
                      suggest: [
                        {
                          desc: 'Use semantic color token',
                          fix: null
                        }
                      ]
                    });
                  }
                });
              }
            });
          }
        };
      }
    },

    'spacing-tokens': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Encourage use of spacing tokens over arbitrary values',
          category: 'Best Practices',
          recommended: true
        }
      },
      create: function(context) {
        return {
          TemplateElement(node) {
            node.value.quasis.forEach((quasi) => {
              // Check for arbitrary pixel values in spacing contexts
              const pixelValues = quasi.value.raw.match(/\d+px/g);
              if (pixelValues) {
                pixelValues.forEach(pixel => {
                  const num = parseInt(pixel);
                  // Common spacing values that should use tokens
                  const spacingValues = [4, 8, 16, 24, 32, 48, 64, 96];
                  if (spacingValues.includes(num)) {
                    context.report({
                      node,
                      message: `Arbitrary spacing value found: ${pixel}. Use spacing tokens instead.`,
                      suggest: [
                        {
                          desc: 'Replace with spacing token',
                          fix: null
                        }
                      ]
                    });
                  }
                });
              }
            });
          }
        };
      }
    },

    'typography-tokens': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Encourage use of typography tokens over arbitrary values',
          category: 'Best Practices',
          recommended: true
        }
      },
      create: function(context) {
        return {
          TemplateElement(node) {
            node.value.quasis.forEach((quasi) => {
              // Check for common font sizes that should use tokens
              const fontSizeMatch = quasi.value.raw.match(/font-size:\s*(\d+)px/);
              if (fontSizeMatch) {
                const size = parseInt(fontSizeMatch[1]);
                const commonSizes = [12, 14, 16, 20, 24, 32, 44];
                if (commonSizes.includes(size)) {
                  context.report({
                    node,
                    message: `Arbitrary font size found: ${size}px. Use typography tokens instead.`,
                    suggest: [
                      {
                        desc: 'Replace with typography token',
                        fix: null
                      }
                    ]
                  });
                }
              }
            });
          }
        };
      }
    }
  }
};
