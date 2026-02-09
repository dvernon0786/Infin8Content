---
title: "UX Agent Reference: Disabled States & Error Patterns"
status: "IMPLEMENTATION GUIDE"
date: "2026-02-04"
---

# 🔴 UX Agent Reference: Disabled States & Error Patterns

**Purpose:** Comprehensive guide for implementing disabled states, error surfaces, and guard visibility in the onboarding UI.

**Audience:** UX Designer / UI Developer  
**Scope:** All 6 onboarding steps + completion screen

---

## Core Principle

> **Guards must be visible but non-punitive.**

Disabled states should:
- ✅ Clearly explain why they're disabled
- ✅ Never feel like an error or failure
- ✅ Provide a path forward (what to do next)
- ✅ Use consistent visual language

---

## Disabled Button States (All Steps)

### Primary Button Disabled

**When:**
- Required fields are empty
- Validation has failed
- API call is in progress
- Server validation failed

**Visual:**
```
┌─────────────────────────────────────┐
│ Next Step                           │
│ Background: #E5E5E7 (Neutral Gray)  │
│ Text: #71717A (Neutral Gray)        │
│ No shadow                           │
│ Cursor: not-allowed                 │
│ Tooltip on hover: Explains why      │
└─────────────────────────────────────┘
```

**Tooltip Examples:**
- "Please complete all required fields"
- "Website URL is invalid"
- "Please add at least 3 competitors"
- "Please check your entries and try again"

**Code Pattern:**
```typescript
<Button
  disabled={!formValid || isLoading}
  title={!formValid ? "Please complete all required fields" : ""}
>
  {isLoading ? "Saving..." : "Next Step"}
</Button>
```

### Secondary Button (Skip & Add Later)

**When:**
- Step is optional (Blog, Integration, Keywords)
- User can skip and configure later

**Visual:**
```
┌─────────────────────────────────────┐
│ Skip & Add Later                    │
│ Background: Transparent             │
│ Border: 1px solid #217CEB           │
│ Text: #217CEB                       │
│ Cursor: pointer                     │
└─────────────────────────────────────┘
```

**Helper Text Below:**
```
"You can configure this anytime in settings"
```

**Never Disabled:** Skip button should always be clickable (unless loading)

---

## Form Input Disabled States

### Required Field Empty

**Visual:**
```
┌─────────────────────────────────────┐
│ Website URL *                       │
│ [_________________________________] │
│ Border: 1px solid #E5E5E7 (normal)  │
│ Background: White                   │
│ Placeholder: "https://example.com"  │
└─────────────────────────────────────┘
```

**State:** Normal (not disabled, not error)

### Required Field Invalid

**Visual:**
```
┌─────────────────────────────────────┐
│ Website URL *                       │
│ [not a url___________________]      │
│ Border: 2px solid #EF4444 (Red)     │
│ Background: White                   │
│ Error message below:                │
│ ⚠️ "Please enter a valid URL"       │
│    "(e.g., https://example.com)"    │
└─────────────────────────────────────┘
```

**Error Message:**
- Color: #EF4444 (Error Red)
- Font size: 12px
- Font weight: 500
- Icon: ⚠️ (optional)
- Always below field
- Always visible (not tooltip)

### Optional Field Empty

**Visual:**
```
┌─────────────────────────────────────┐
│ Blog Root URL (optional)            │
│ [_________________________________] │
│ Border: 1px solid #E5E5E7           │
│ Background: White                   │
│ Placeholder: "https://example.com..." │
└─────────────────────────────────────┘
```

**State:** Normal (no error, no validation required)

### Field with AI Autocomplete Loading

**Visual:**
```
┌─────────────────────────────────────┐
│ Website URL *                       │
│ [https://example.com___________]    │
│ [✨ Auto-fill] → [⏳ Loading...]    │
│                                     │
│ Business Name *                     │
│ [████████░░░░░░░░░░░░░░░░░░░░░]    │ ← Skeleton loader
│                                     │
│ Description *                       │
│ [████████████░░░░░░░░░░░░░░░░░░]   │ ← Skeleton loader
└─────────────────────────────────────┘
```

**Behavior:**
- Auto-fill button shows loading state
- Fields show skeleton loaders
- User can still interact (edit, skip)
- Never auto-advances

---

## Step-Specific Disabled States

### STEP 1: Business

**Primary Button Disabled When:**
- Website URL is empty OR invalid format
- Business Name is empty OR < 2 chars
- Description is empty OR < 10 chars

**Example Disabled Scenarios:**

**Scenario 1: All fields empty**
```
Website URL: [_____________________]
Business Name: [_____________________]
Description: [_____________________]

[Next Step] ← DISABLED
Tooltip: "Please complete all required fields"
```

**Scenario 2: Invalid URL**
```
Website URL: [not a url_____________]
             ↓ RED BORDER
Error: "Please enter a valid URL"

[Next Step] ← DISABLED
```

**Scenario 3: Description too short**
```
Description: [Hi_____________________]
             ↓ RED BORDER
Error: "Description must be at least 10 characters"

[Next Step] ← DISABLED
```

### STEP 2: Competitors

**Primary Button Disabled When:**
- Fewer than 3 competitors added
- More than 7 competitors added
- Any competitor URL is invalid

**Example Disabled Scenarios:**

**Scenario 1: Not enough competitors**
```
Competitors: [https://comp1.com] [✕]
             [https://comp2.com] [✕]
             (need 3-7)

[Next Step] ← DISABLED
Tooltip: "Add at least 3 competitors"
```

**Scenario 2: Invalid URL**
```
Competitors: [https://comp1.com] [✕]
             [not a url] [✕]
             ↓ RED BORDER
Error: "Please enter a valid URL"

[Next Step] ← DISABLED
```

### STEP 3: Blog Configuration

**Primary Button:** Always enabled (all fields optional)

**Skip Button:** Always enabled

**Behavior:** User can proceed with or without filling fields

### STEP 4: Article Rules

**Primary Button Disabled When:**
- Language not selected
- Tone/Style not selected

**Example Disabled Scenarios:**

**Scenario 1: Required dropdown empty**
```
Language: [▼ Select language________]
          ↓ RED BORDER
Error: "Please select a language"

[Next Step] ← DISABLED
```

### STEP 5: Keyword Settings

**Primary Button Disabled When:**
- Region not selected
- Auto-generate toggle not set

**Example Disabled Scenarios:**

**Scenario 1: Required field empty**
```
Region: [▼ Select region__________]
        ↓ RED BORDER
Error: "Please select a region"

[Next Step] ← DISABLED
```

### STEP 6: Integration

**Primary Button:** Always enabled (all fields optional)

**Skip Button:** Always enabled

**Conditional Disabling:**
- If platform selected, credentials become required
- If credentials invalid, button disabled

**Example Disabled Scenarios:**

**Scenario 1: Platform selected, credentials empty**
```
Platform: [▼ WordPress_____________]

WordPress URL: [_____________________]
               ↓ RED BORDER
Error: "WordPress URL is required"

API Username: [_____________________]
              ↓ RED BORDER
Error: "API username is required"

[Complete Setup] ← DISABLED
```

---

## API Error Surfaces

### Network Error

**When:** Connection lost, timeout, server unreachable

**Visual:**
```
┌─────────────────────────────────────┐
│ ⚠️ Connection Error                 │
│ Unable to save your information.    │
│ Please check your connection and    │
│ try again.                          │
│                                     │
│ [Retry]                             │
└─────────────────────────────────────┘
```

**Placement:** Banner at top of card

**Behavior:**
- Show retry button
- Allow user to edit and retry
- Dismiss on successful retry

### Validation Error (Server-Side)

**When:** Server rejects input (e.g., invalid email, duplicate)

**Visual:**
```
┌─────────────────────────────────────┐
│ ❌ Validation Failed                │
│ Please check the following:         │
│ • Website URL is not accessible     │
│ • Business name already exists      │
│                                     │
│ [Retry]                             │
└─────────────────────────────────────┘
```

**Placement:** Banner at top of card

**Behavior:**
- List all validation errors
- Allow user to edit and retry
- Focus first invalid field

### Authentication Error

**When:** User not authenticated, session expired

**Visual:**
```
┌─────────────────────────────────────┐
│ ❌ Authentication Required          │
│ Your session has expired.           │
│ Please log in again.                │
│                                     │
│ [Log In]                            │
└─────────────────────────────────────┘
```

**Behavior:**
- Redirect to login
- Preserve form state if possible
- Return to onboarding after login

### Server Error

**When:** 500 error, database error, etc.

**Visual:**
```
┌─────────────────────────────────────┐
│ ❌ Something Went Wrong             │
│ We encountered an error while       │
│ saving your information.            │
│ Error Code: 500                     │
│                                     │
│ [Retry] [Contact Support]           │
└─────────────────────────────────────┘
```

**Behavior:**
- Show error code for support
- Provide retry button
- Provide support contact link

---

## Guard Visibility Patterns

### Route Guard (Redirect)

**When:** User tries to access `/dashboard` without onboarding

**Behavior:**
- Silent redirect to `/onboarding/business`
- No error message
- No toast notification
- Preserve form state if returning

### API Guard (403 Response)

**When:** User calls API without completing onboarding

**Response:**
```json
{
  "error": "ONBOARDING_INCOMPLETE",
  "status": 403,
  "message": "Complete onboarding before accessing this resource",
  "redirect": "/onboarding/business"
}
```

**Frontend Behavior:**
- Show error banner
- Redirect to onboarding
- Preserve context if possible

### Validator Guard (Pre-Workflow)

**When:** User tries to create workflow without valid onboarding

**Response:**
```json
{
  "error": "ONBOARDING_INVALID",
  "status": 403,
  "details": [
    "website_url is required",
    "business_description is required",
    "competitors: minimum 3 required"
  ]
}
```

**Frontend Behavior:**
- Show error banner with details
- Redirect to onboarding
- Highlight which steps need completion

---

## Loading States

### Button Loading

**Visual:**
```
[Next Step] → [⏳ Saving...]
```

**Behavior:**
- Show spinner
- Replace text with "Saving..."
- Disable button
- Prevent multiple clicks

### Field Loading (AI Autocomplete)

**Visual:**
```
Business Name: [████████░░░░░░░░░░░░░░░░░░░░░░]
Description:   [████████████░░░░░░░░░░░░░░░░░░░]
```

**Behavior:**
- Show skeleton loaders
- Allow user to interact
- Never auto-advance
- Allow cancel/skip

### Full Page Loading

**Visual:**
```
[Stepper] (faded)
[Title] (faded)
[Card] (faded)
[Spinner in center]
```

**Behavior:**
- Show spinner overlay
- Disable all interactions
- Show loading message

---

## Accessibility Patterns

### Focus Management

**Visible Focus Ring:**
```
[Input field with 2px blue ring]
```

**Color:** #217CEB (Brand Blue)  
**Width:** 2px  
**Offset:** 2px from border

### Error Association

**ARIA Attributes:**
```html
<input
  id="website-url"
  aria-describedby="website-url-error"
/>
<span id="website-url-error" role="alert">
  Please enter a valid URL
</span>
```

### Keyboard Navigation

**Tab Order:**
1. Website URL input
2. Auto-fill button
3. Business Name input
4. Description input
5. Audiences input
6. Skip button
7. Next button

**Enter Key:**
- In tag input: Add tag
- In last field: Submit form

**Escape Key:**
- Close any open dropdowns
- Cancel AI autocomplete

---

## Implementation Checklist

### Disabled States
- [ ] Primary button disabled when form invalid
- [ ] Disabled button shows tooltip explaining why
- [ ] Secondary button always enabled (for optional steps)
- [ ] Disabled state color is consistent (#E5E5E7)
- [ ] Cursor is "not-allowed" when disabled

### Error States
- [ ] Invalid fields show red border
- [ ] Error messages appear below field
- [ ] Error messages are red (#EF4444)
- [ ] Error messages are always visible (not tooltip)
- [ ] Multiple errors listed clearly

### Loading States
- [ ] Button shows spinner + "Saving..."
- [ ] Fields show skeleton loaders during AI autocomplete
- [ ] User can still interact during loading
- [ ] Never auto-advances after AI completes

### Accessibility
- [ ] Focus ring visible (2px blue)
- [ ] Error messages linked via aria-describedby
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Color contrast ≥4.5:1
- [ ] Touch targets ≥44px

### Guard Visibility
- [ ] Disabled states explain why
- [ ] Error messages are clear and actionable
- [ ] No punitive language ("You must...", "You can't...")
- [ ] Always provide a path forward

---

**UX Agent Reference: COMPLETE ✅**

Ready for implementation.
