#!/bin/bash

# Pre-commit hook for Infin8Content Design System Compliance
# This script validates design system compliance before allowing commits

set -e  # Exit on any error

echo "🔍 Running Design System Compliance Checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track if any checks failed
FAILED=0

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "PASS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "FAIL")
            echo -e "${RED}❌ $message${NC}"
            FAILED=1
            ;;
        "WARN")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

# Check if there are any relevant files to check
RELEVANT_FILES=""
for file in $STAGED_FILES; do
  if [[ "$file" =~ \.(ts|tsx|js|jsx|css|scss)$ ]]; then
    RELEVANT_FILES="$RELEVANT_FILES $file"
  fi
done

if [ -z "$RELEVANT_FILES" ]; then
  print_status "PASS" "No relevant files to check"
  exit 0
fi

echo "Checking staged files: $RELEVANT_FILES"

# 1. Check for hard-coded colors in source files
echo ""
print_status "INFO" "Checking for hard-coded colors..."

COLOR_VIOLATIONS=0
for file in $RELEVANT_FILES; do
  if grep -n "#[0-9A-Fa-f]\{6\}" "$file" >/dev/null 2>&1; then
    print_status "FAIL" "Hard-coded colors found in $file"
    grep -n "#[0-9A-Fa-f]\{6\}" "$file" | head -5 | sed 's/^/   /'
    COLOR_VIOLATIONS=$((COLOR_VIOLATIONS + 1))
  fi
done

if [ $COLOR_VIOLATIONS -eq 0 ]; then
    print_status "PASS" "No hard-coded colors found"
else
    echo ""
    echo "Please replace hard-coded colors with design tokens:"
    echo "   #217CEB → var(--color-primary-blue)"
    echo "   #4A42CC → var(--color-primary-purple)"
    echo "   #10B981 → var(--color-success)"
    echo "   #F59E0B → var(--color-warning)"
    echo "   #EF4444 → var(--color-error)"
    echo "   #3B82F6 → var(--color-info)"
fi

# 2. Check for inline styles (with exceptions for critical layouts)
echo ""
print_status "INFO" "Checking for inline styles..."

STYLE_VIOLATIONS=0
CRITICAL_VIOLATIONS=0
for file in $RELEVANT_FILES; do
  if grep -n "style={" "$file" >/dev/null 2>&1; then
    # Check if this is a critical layout file (allowed due to CSS specificity crisis)
    # Treat dashboard files as critical layout exceptions due to CSS specificity needs
    if [[ "$file" =~ (verify-email|create-organization|payment/success|app/dashboard) ]]; then
        print_status "WARN" "Inline styles found in critical layout file (allowed): $file"
        grep -n "style={" "$file" | head -3 | sed 's/^/   /'
        CRITICAL_VIOLATIONS=$((CRITICAL_VIOLATIONS + 1))
    else
        print_status "FAIL" "Inline styles found in $file"
        grep -n "style={" "$file" | head -5 | sed 's/^/   /'
        STYLE_VIOLATIONS=$((STYLE_VIOLATIONS + 1))
    fi
  fi
done

if [ $STYLE_VIOLATIONS -eq 0 ]; then
    if [ $CRITICAL_VIOLATIONS -gt 0 ]; then
        print_status "PASS" "Only critical layout inline styles found (allowed)"
    else
        print_status "PASS" "No inline styles found"
    fi
else
    echo ""
    echo "Please replace inline styles with CSS classes or design tokens."
    echo "Refer to /docs/design-system/tokens/ for available tokens."
fi

# 3. Check for arbitrary spacing values
echo ""
print_status "INFO" "Checking for arbitrary spacing values..."

SPACING_VIOLATIONS=0
for file in $RELEVANT_FILES; do
  # Look for arbitrary pixel values that aren't in the spacing scale
  if grep -n -E "\b(1[0-9]|[2-9][0-9])px\b" "$file" >/dev/null 2>&1; then
    # Filter out valid spacing values
    ARBITRARY=$(grep -n -E "\b(1[0-9]|[2-9][0-9])px\b" "$file" | grep -v -E "(4px|8px|16px|24px|32px|48px|64px|96px)" || true)
    if [ -n "$ARBITRARY" ]; then
        print_status "WARN" "Arbitrary spacing values found in $file:"
        echo "$ARBITRARY" | head -5 | sed 's/^/   /'
        SPACING_VIOLATIONS=$((SPACING_VIOLATIONS + 1))
    fi
  fi
done

if [ $SPACING_VIOLATIONS -eq 0 ]; then
    print_status "PASS" "No arbitrary spacing values found"
else
    echo ""
    echo "Consider using spacing tokens:"
    echo "   4px → var(--spacing-xs)"
    echo "   8px → var(--spacing-sm)"
    echo "   16px → var(--spacing-md)"
    echo "   24px → var(--spacing-lg)"
    echo "   32px → var(--spacing-xl)"
    echo "   48px → var(--spacing-2xl)"
fi

# 4. Run ESLint design system checks if available
echo ""
print_status "INFO" "Running ESLint design system rules..."

if command -v npx >/dev/null 2>&1; then
    ESLINT_VIOLATIONS=0
    for file in $RELEVANT_FILES; do
        if npx eslint --config .eslintrc.design-system.js "$file" 2>/dev/null | grep -q "error\|warning"; then
            print_status "FAIL" "ESLint violations found in $file"
            npx eslint --config .eslintrc.design-system.js "$file" 2>/dev/null | head -5 | sed 's/^/   /'
            ESLINT_VIOLATIONS=$((ESLINT_VIOLATIONS + 1))
        fi
    done
    
    if [ $ESLINT_VIOLATIONS -eq 0 ]; then
        print_status "PASS" "ESLint design system checks passed"
    fi
else
    print_status "WARN" "npx not found - skipping ESLint checks"
fi

# 5. Check for design token documentation consistency
echo ""
print_status "INFO" "Checking design token documentation..."

if [ -f "docs/design-system/README.md" ] && [ -f "docs/design-system/tokens/colors.md" ] && [ -f "docs/design-system/tokens/spacing.md" ]; then
    print_status "PASS" "Design token documentation exists"
else
    print_status "WARN" "Design token documentation may be missing"
fi

# 6. Check component library consistency
echo ""
print_status "INFO" "Checking component library..."

if [ -d "infin8content/components" ]; then
    COMPONENT_COUNT=$(find infin8content/components -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l)
    if [ "$COMPONENT_COUNT" -gt 0 ]; then
        print_status "PASS" "Component library found ($COMPONENT_COUNT components)"
    else
        print_status "WARN" "Component library appears empty"
    fi
else
    print_status "WARN" "Component library directory not found"
fi

# 7. Total violations and final summary
echo ""
echo "📊 Compliance Check Summary:"
TOTAL_VIOLATIONS=$((COLOR_VIOLATIONS + STYLE_VIOLATIONS + ESLINT_VIOLATIONS))

if [ $TOTAL_VIOLATIONS -gt 0 ]; then
    print_status "FAIL" "Design system compliance checks FAILED"
    echo ""
    echo "Found violations:"
    echo "   • Hard-coded colors: $COLOR_VIOLATIONS"
    echo "   • Inline styles: $STYLE_VIOLATIONS"
    echo "   • ESLint violations: $ESLINT_VIOLATIONS"
    echo "   • Spacing warnings: $SPACING_VIOLATIONS"
    echo ""
    echo "Please fix the issues above before committing."
    echo "For help, refer to:"
    echo "   • /docs/design-system/README.md"
    echo "   • /docs/design-system/tokens/colors.md"
    echo "   • /docs/design-system/tokens/spacing.md"
    echo "   • CSS Specificity Crisis Resolution documentation"
    exit 1
else
    print_status "PASS" "All design system compliance checks PASSED"
    echo ""
    echo "🎉 Ready to commit! Your code follows design system guidelines."
fi

echo ""
echo "🔗 Design System Resources:"
echo "   • Documentation: /docs/design-system/"
echo "   • Tokens: /docs/design-system/tokens/"
echo "   • Components: /infin8content/components/"
echo "   • Compliance: .eslintrc.design-system.js"
echo "   • CSS Crisis Resolution: CSS specificity crisis documentation"
