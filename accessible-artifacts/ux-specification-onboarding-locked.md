---
title: "UX Specification: Onboarding & Guards (LOCKED)"
status: "LOCKED"
version: "1.0"
date: "2026-02-04"
validated_against:
  - "PRD v1.0 (LOCKED)"
  - "Perfect This is exactly.md (Source of Truth)"
---

# 🎨 UX Specification: Onboarding & Guards (LOCKED)

**Status:** ✅ VALIDATED & LOCKED  
**Date:** 2026-02-04  
**Validated Against:** PRD v1.0 + Reference Document  
**Ready For:** Story Breakdown (Step 2)

---

## 📋 Validation Summary

### ✅ PRD Alignment Verified
- **6-step onboarding wizard**: Business → Competitors → Blog → Articles → Keywords → Integration
- **Server-side validation**: Authoritative, frontend state irrelevant
- **Hard gates**: Cannot bypass onboarding to reach dashboard
- **Deterministic pipeline**: Sequential, no parallel execution
- **Idempotent publishing**: WordPress integration prevents duplicates

### ✅ Reference Document Compliance
- **Brand consistency**: Single color system, no per-step themes
- **Button hierarchy**: Primary (brand color) + Secondary (outline) only
- **Stepper behavior**: Non-clickable progress indicator
- **Guard visibility**: Disabled states explain why
- **Skip logic**: Optional steps feel safe, not risky
- **Completion handoff**: Clear transition to Intent Engine

### ✅ Architecture Integrity
- **No frontend-only validation**: Server is authoritative
- **No temporary logic**: All decisions are structural
- **No scope expansion**: Onboarding ≠ Intent Engine execution
- **No visual drift**: Consistent design tokens throughout

---

## 🎯 Core UX Principle (Non-Negotiable)

> **"Onboarding should feel like configuring a powerful machine, not filling out a survey."**

The experience must be:
- **One continuous branded journey** (not a multi-form wizard)
- **Visually coherent** (Step 1 and Step 6 clearly belong together)
- **Structurally enforced** (guards are visible, not hidden)
- **Psychologically clear** (users understand why each step matters)

---

## 🎨 Brand System (Locked)

### Primary Colors
```
--brand-electric-blue:    #217CEB    (Primary CTA, active step, focus ring)
--brand-infinite-purple:  #4A42CC    (Accent, gradient)
--brand-deep-charcoal:    #2C2C2E    (Text/Primary)
--brand-soft-light-gray:  #F4F4F6    (Background)
--brand-white:            #FFFFFF    (Card backgrounds)
```

### Color Usage Rules
| Element | Color | Rule |
|---------|-------|------|
| Primary CTA | Brand Blue (#217CEB) | Solid, no gradients |
| Secondary CTA | Brand Blue outline | 1px border, transparent bg |
| Disabled CTA | Neutral Gray (#71717A) | No opacity tricks |
| Active Step | Brand Blue (#217CEB) | Bold label + indicator |
| Completed Step | Brand Blue (lighter) | Check icon + lighter shade |
| Info Boxes | Soft Green or Neutral | Left border accent |
| Errors | System Red (#EF4444) | Standard error color |

**Hard Rules:**
- ❌ No gradients in buttons
- ❌ No random highlight colors
- ❌ No per-step color themes
- ❌ No emojis in onboarding

---

## 🔘 Button System (Locked)

### Primary Button
- **Background:** Brand Blue (#217CEB)
- **Text:** White
- **Border Radius:** 8px (consistent with app)
- **Padding:** 12px 24px
- **Font Weight:** 600
- **Usage:** "Save Information", "Next Step", "Complete Setup"
- **Position:** Bottom-right or bottom-center
- **Loading State:** Spinner + "Saving…"

### Secondary Button
- **Background:** Transparent
- **Border:** 1px solid Brand Blue (#217CEB)
- **Text:** Brand Blue (#217CEB)
- **Border Radius:** 8px
- **Padding:** 12px 24px
- **Font Weight:** 600
- **Usage:** "Skip & Add Later", "Back"

### Button Behavior Rules
- **One primary CTA per screen** (never multiple primary actions)
- **Disabled state must explain why** (tooltip or helper text)
- **Never auto-advance** (user controls progression)
- **Loading state is explicit** (spinner + text, not silent)

**Hard Rules:**
- ❌ No ghost buttons
- ❌ No text-only CTAs
- ❌ No button restyling per step

---

## 📍 Stepper (Navigation Spine)

### Stepper Design
- **Position:** Horizontal, fixed at top of every onboarding screen
- **Steps:** Business → Competitors → Blog → Articles → Keywords → Integration
- **Visual:** Numbered circles with labels
- **Behavior:** Non-clickable (progress feedback only, not navigation)

### Stepper States

| State | Visual | Behavior |
|-------|--------|----------|
| **Completed** | Brand Blue circle + check icon | Lighter shade |
| **Current** | Brand Blue circle + bold label | Full opacity |
| **Upcoming** | Neutral Gray circle | Disabled appearance |

**Hard Rules:**
- ❌ Stepper is NOT clickable
- ❌ No skipping ahead visually
- ❌ No step reordering

---

## 📐 Layout & Spacing (Locked)

### Page Structure (All Steps)
```
┌─────────────────────────────────────┐
│ [Stepper: Business → Competitors...] │
├─────────────────────────────────────┤
│                                     │
│ [Title + Explanatory Copy]          │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ [Main Content Card]           │   │
│ │                               │   │
│ │ [Form Inputs / Info Boxes]    │   │
│ │                               │   │
│ └───────────────────────────────┘   │
│                                     │
│ [Secondary Button] [Primary Button] │
│                                     │
└─────────────────────────────────────┘
```

### Spacing Rules
- **Max content width:** Same as dashboard forms (600-700px)
- **Card padding:** 32px (consistent across all steps)
- **Input spacing:** 16px between fields
- **Button spacing:** 16px gap between secondary/primary
- **Stepper to title:** 24px
- **Title to card:** 24px

### Card Styling
- **Background:** White (#FFFFFF)
- **Border Radius:** 12px
- **Shadow:** 0 4px 6px rgba(0, 0, 0, 0.07)
- **Border:** None (shadow only)

---

## 📝 Form Inputs (Consistency)

### Input Components
- **Use existing input components** (no new designs)
- **Border Radius:** 8px (consistent with app)
- **Focus State:** Brand Blue ring (2px)
- **Label Position:** Always above input
- **Placeholder:** Descriptive, not instructional

### Tag Inputs (Audiences, Competitors)
- **Chip Background:** Light brand tint (#EFF6FF)
- **Chip Text:** Brand Blue (#217CEB)
- **Chip Border Radius:** 20px (pill shape)
- **Removable:** "x" icon on hover
- **Keyboard Friendly:** Enter to add, Backspace to remove

### Validation
- **Error State:** Red border + error message below
- **Success State:** Green checkmark (no border change)
- **Helper Text:** Gray text below input

---

## 🤖 AI-Assisted Actions (Autocomplete)

### Button Style
- **Style:** Secondary button
- **Icon:** Small "✨" (sparkle, optional)
- **Label:** "Auto-fill with AI" or "Suggest with AI"
- **Position:** Right of Website URL field

### Behavior
- **Loading:** Skeleton loaders inside form fields
- **Population:** Progressive field filling (not all at once)
- **Editability:** User can edit everything (no locked fields)
- **Auto-advance:** ❌ Never auto-advance after AI completes

**Hard Rules:**
- ❌ Never lock AI-filled fields
- ❌ Never auto-advance
- ❌ Never hide the AI action

---

## ℹ️ Informational UI (Trust & Clarity)

### Info Boxes
- **Used in:** Competitors, Blog, Integration steps
- **Background:** Soft green (#F0FDF4) or neutral gray (#F9FAFB)
- **Left Border:** 4px accent (green or neutral)
- **Padding:** 16px
- **Border Radius:** 8px
- **Text:** Small, clear bullet points

### Purpose
> Explain **why** we ask, not **what** to enter.

Example:
```
ℹ️ Why competitors matter:
• Understand market positioning
• Identify content gaps
• Benchmark quality standards
```

---

## ⏭️ Skip Logic (UX Clarity)

### Optional Steps
- **Blog Configuration:** Can skip, add later
- **Integration:** Can skip, add later
- **Keywords:** Can skip, add later

### Skip Button Behavior
- **Style:** Secondary button
- **Label:** "Skip & Add Later"
- **Clarity:** Helper text: "You can configure this anytime in settings"
- **Visual:** Never looks like an error or warning
- **Feeling:** Skipping should feel **safe and reversible**

---

## 🎉 Completion Moment (Psychological Payoff)

### Final Step (After Integration)
- **Title:** "You're all set!"
- **Message:** "Your organization is configured and ready to create intent-driven content."
- **Visual:** Checkmark or success icon (optional)
- **Primary CTA:** "Create Your First Content Workflow"
- **Secondary CTA:** "Explore Settings" (optional)

### Handoff to Intent Engine
- **CTA Text:** "Create Your First Content Workflow"
- **Destination:** `/intent/workflows/create` (Epic 34 entry point)
- **Behavior:** Redirect after click
- **No Return:** Onboarding is complete, workflow execution begins

---

## 🚫 Hard Constraints (What NOT To Do)

❌ Do not introduce a new onboarding theme  
❌ Do not restyle buttons per step  
❌ Do not use different card styles  
❌ Do not use emojis in onboarding  
❌ Do not expose workflow step numbers (Epic 33–39 are internal)  
❌ Do not create frontend-only validation  
❌ Do not allow skipping to later steps  
❌ Do not show progress percentage  
❌ Do not use animations that distract  
❌ Do not introduce new component types  

---

## 🔐 Guard Visibility (Server Authority)

### Disabled States (When Server Says "No")

**Scenario 1: Incomplete Required Fields**
```
[Primary Button: "Next Step"] (DISABLED)
↓
Tooltip: "Please complete all required fields"
```

**Scenario 2: Invalid Input**
```
[Input Field] (RED BORDER)
↓
Error Message: "Please enter a valid URL"
```

**Scenario 3: Server Validation Failed**
```
[Primary Button: "Save Information"] (DISABLED)
↓
Tooltip: "Please check your entries and try again"
```

### Disabled Button Styling
- **Background:** Neutral Gray (#E5E5E7)
- **Text:** Neutral Gray (#71717A)
- **Cursor:** Not-allowed
- **Tooltip:** Always present (explains why)

---

## 📱 Responsive Design (Desktop + Mobile)

### Desktop (≥769px)
- **Max width:** 700px centered
- **Stepper:** Horizontal, full width
- **Buttons:** Side-by-side (secondary left, primary right)
- **Spacing:** Full 32px padding

### Mobile (≤768px)
- **Max width:** 100% with 16px margins
- **Stepper:** Horizontal, scrollable if needed
- **Buttons:** Stacked vertical (secondary top, primary bottom)
- **Spacing:** 16px padding
- **Font sizes:** Responsive (no changes to hierarchy)

---

## 🔄 Screen-by-Screen Flows (Locked)

### STEP 1: Business
**Purpose:** Collect business fundamentals

**Fields:**
- Website URL (required, with AI autocomplete)
- Business Name (required)
- Business Description (required, textarea)
- Target Audiences (optional, tag input)

**Actions:**
- Primary: "Next Step"
- Secondary: "Skip & Add Later"

**Info Box:**
```
ℹ️ Why we ask:
• Understand your market position
• Tailor content to your audience
• Generate relevant keywords
```

**Validation:**
- Website URL: Valid URL format
- Business Name: Min 2 chars
- Description: Min 10 chars

---

### STEP 2: Competitors
**Purpose:** Identify competitive landscape

**Fields:**
- Competitor URLs (tag input, 3-7 required)
- Optional: Competitor names (auto-extracted from domain)

**Actions:**
- Primary: "Next Step"
- Secondary: "Back"

**Info Box:**
```
ℹ️ Why competitors matter:
• Understand market positioning
• Identify content gaps
• Benchmark quality standards
• Inform keyword strategy
```

**Validation:**
- Min 3 competitors, max 7
- Valid URLs only
- No duplicates

---

### STEP 3: Blog Configuration
**Purpose:** Understand existing content

**Fields:**
- Blog Root URL (optional)
- Sitemap URL (optional)
- Best Performing Articles (optional, URL list)
- Google Search Console Connection (optional, skip allowed)

**Actions:**
- Primary: "Next Step"
- Secondary: "Skip & Add Later"

**Info Box:**
```
ℹ️ Why we ask:
• Understand your content style
• Learn from top performers
• Optimize for your audience
• Maintain brand consistency
```

**Validation:**
- URLs: Valid format if provided
- No required fields (all optional)

---

### STEP 4: Article Rules (Global Settings)
**Purpose:** Define content defaults

**Fields:**
- Language (dropdown, default: English)
- Tone/Style (dropdown: Professional, Conversational, Academic, etc.)
- Internal Links (toggle: on/off)
- Auto-Publish (toggle: on/off)
- Global Instructions (textarea, optional)
- Image Style (dropdown, optional)
- Brand Color (color picker, optional)

**Actions:**
- Primary: "Next Step"
- Secondary: "Back"

**Info Box:**
```
ℹ️ These are global defaults:
• Applied to all generated articles
• Can be overridden per workflow
• Ensures brand consistency
```

**Validation:**
- Language: Required
- Tone/Style: Required
- Toggles: Default to sensible values

---

### STEP 5: Keyword Settings
**Purpose:** Configure keyword generation

**Fields:**
- Region (dropdown: US, UK, CA, AU, etc.)
- Auto-Generate Keywords (toggle: on/off)
- Keyword Limits (optional, numeric)

**Actions:**
- Primary: "Next Step"
- Secondary: "Back"

**Info Box:**
```
ℹ️ Keyword configuration:
• Region affects SERP localization
• Auto-generation starts with workflows
• Limits prevent runaway costs
```

**Validation:**
- Region: Required
- Keyword Limits: Numeric if provided

---

### STEP 6: Integration
**Purpose:** Connect publishing platforms

**Fields:**
- Platform Selection (dropdown: WordPress, Webflow, Custom, None)
- API Credentials (conditional, based on platform)
- Mapping Fields (conditional, based on platform)

**Actions:**
- Primary: "Complete Setup"
- Secondary: "Skip & Add Later"

**Info Box:**
```
ℹ️ Publishing integration:
• Optional - can be added later
• Enables one-click publishing
• Supports multiple platforms
```

**Validation:**
- Platform: Optional
- Credentials: Required if platform selected
- Credentials: Validated against platform API

---

### STEP 7: Completion
**Purpose:** Confirm setup and transition

**Content:**
- Success message: "You're all set!"
- Confirmation: "Your organization is configured and ready."
- Value statement: "You're ready to create intent-driven content."

**Actions:**
- Primary: "Create Your First Content Workflow"
- Secondary: "Explore Settings" (optional)

**Behavior:**
- Primary CTA → `/intent/workflows/create` (Epic 34)
- Secondary CTA → `/settings/organization` (optional)

---

## 🔒 Route Guards (Structural Enforcement)

### Before Onboarding Completion
**Allowed Routes:**
- `/onboarding/*` (all onboarding steps)
- `/billing` (payment info)
- `/settings/profile` (personal settings)
- `/logout`

**Blocked Routes (Redirect to `/onboarding/business`):**
- `/dashboard`
- `/articles`
- `/keywords`
- `/intent/workflows/*`
- `/intent/*`

**API Response (Blocked Endpoints):**
```json
{
  "error": "ONBOARDING_INCOMPLETE",
  "status": 403,
  "message": "Complete onboarding before accessing this resource"
}
```

### After Onboarding Completion
**All routes accessible**
- Onboarding is permanently complete
- Cannot re-enter onboarding flow
- Can edit settings anytime

---

## 🎯 Error & Blocked State UX

### Server Validation Error
```
[Input Field] (RED BORDER)
↓
Error Message (Red, below field): "Invalid URL format"
↓
User corrects → Error clears
```

### Required Field Missing
```
[Primary Button: "Next Step"] (DISABLED, GRAY)
↓
Tooltip (on hover): "Please complete all required fields"
↓
User fills field → Button enables
```

### API Error (Network/Server)
```
[Primary Button: "Save Information"] (DISABLED)
↓
Error Message (Red, below button): "Unable to save. Please try again."
↓
Retry button appears → User retries
```

### Onboarding Already Complete
```
User navigates to `/onboarding/business`
↓
Redirect to `/dashboard` (silently, no error)
```

---

## 📊 Accessibility & Compliance

### WCAG 2.1 AA Compliance
- **Color Contrast:** All text meets 4.5:1 ratio
- **Focus States:** Visible focus ring (2px brand blue)
- **Keyboard Navigation:** Tab through all fields and buttons
- **Labels:** All inputs have associated labels
- **Error Messages:** Linked to inputs via aria-describedby
- **Stepper:** Semantic HTML with aria-current="step"

### Mobile Accessibility
- **Touch Targets:** Min 44px × 44px for buttons
- **Spacing:** Min 8px between interactive elements
- **Font Size:** Min 16px (prevents zoom on iOS)
- **Viewport:** Responsive, no horizontal scroll

---

## 🔄 State Management (Frontend)

### Form State
- **Dirty Tracking:** Track which fields have been edited
- **Validation State:** Real-time validation (no submit-only)
- **Disabled State:** Primary button disabled until all required fields valid
- **Loading State:** Show spinner during API call

### Navigation State
- **Current Step:** Track which step user is on
- **Completed Steps:** Mark steps as completed
- **Can Go Back:** Allow back navigation to previous steps
- **Cannot Skip Ahead:** Enforce sequential progression

### Error State
- **Field Errors:** Show inline error messages
- **Form Errors:** Show banner error at top of card
- **API Errors:** Show retry button + error message

---

## ✅ Validation Checklist (Before Implementation)

- [ ] All 6 steps follow locked structure
- [ ] Stepper is non-clickable progress indicator
- [ ] Brand colors used consistently (no new colors)
- [ ] Buttons are primary (brand blue) or secondary (outline) only
- [ ] No gradients in buttons
- [ ] No emojis in onboarding
- [ ] Skip logic feels safe, not risky
- [ ] Disabled states explain why
- [ ] AI autocomplete never locks fields
- [ ] Completion handoff is clear
- [ ] Route guards prevent dashboard access
- [ ] API guards return 403 ONBOARDING_INCOMPLETE
- [ ] Mobile responsive (stacked buttons, scrollable stepper)
- [ ] Accessibility compliant (WCAG 2.1 AA)
- [ ] No frontend-only validation (server is authoritative)

---

## 🚀 Ready for Story Breakdown

**This UX specification is:**
- ✅ Validated against PRD v1.0
- ✅ Aligned with reference document
- ✅ Architecturally sound
- ✅ Guard-aware
- ✅ Non-bypassable
- ✅ Locked and ready for implementation

**Next Step:** Story breakdown (Epic A, B, C stories)

---

**UX Specification Status: LOCKED ✅**
