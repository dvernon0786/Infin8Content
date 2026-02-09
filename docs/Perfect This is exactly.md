Perfect. This is exactly the right moment to slow down and **align the current onboarding with the Intent Engine reality** before touching code.

I’ve carefully read **both** parts:

1. **Current onboarding (as implemented today)**
2. **Expected onboarding (new product-led flow)**

Below is a **clear, structured alignment analysis**, followed by a **mapping to Epics 33–39**, and then a **clean execution plan** (what changes, what stays, what moves).

No assumptions. No shortcuts.

---

# 1. High-Level Truth (Alignment Check)

### You are NOT replacing authentication, org creation, or billing

Those are **pre-onboarding platform requirements**, not content onboarding.

**These remain unchanged and correct:**

* Registration
* OTP verification
* Organization creation
* Payment
* Dashboard access guards

✅ Keep them exactly as-is.

What you are changing is:

> **What happens AFTER a user is allowed into the product**
> (i.e. *content onboarding*, not account onboarding)

This distinction is critical and you’re on the right track.

---

# 2. Current vs Expected Onboarding (Reality Gap)

## Current Reality (Today)

After `/dashboard`, users can:

* Create articles immediately
* Run keyword research
* Use features in any order

⚠️ Problems:

* No enforced intent
* No ICP gate
* No competitor-first logic
* No global article rules
* No workflow state ownership

This is **legacy behavior**, even if the UI is new.

---

## Expected Reality (New)

After `/dashboard`, users must complete:

**Business → Competitors → Blog → Articles → Keywords → Integration → Done**

This is **exactly** an Intent Engine *configuration workflow*.

Good news:
👉 This maps *cleanly* to **Epic 33 + early Epic 34**, not the whole engine yet.

---

# 3. Exact Mapping: New Onboarding → Intent Engine Epics

This is the most important section.

## STEP 1 – Business

### “Tell us about your business”

### Maps to:

**Epic 33 – Workflow Foundation & Organization Setup**

| Onboarding Field | Destination                          |
| ---------------- | ------------------------------------ |
| Website URL      | `organizations.website_url`          |
| Business name    | `organizations.name`                 |
| Description      | `organizations.description`          |
| Target audiences | `organizations.icp_seed_data` (JSON) |
| AI autocomplete  | Onboarding Agent (pre-ICP assist)    |

🔑 Key Point
This is **NOT** Story 34.1 ICP generation yet.
This is **input collection**, not intent validation.

✔️ Correct placement: **Epic 33.2 (expanded)**

---

## STEP 2 – Competitors

### “List your competitors”

### Maps to:

**Epic 33.3: Configure Competitor URLs**

| Rule                  | Match               |
| --------------------- | ------------------- |
| 3–7 competitors       | ✔️ aligns perfectly |
| Org-level persistence | ✔️ correct          |
| Editable anytime      | ✔️ correct          |

🔑 Key Point
Competitors belong to the **organization**, not the workflow.

✔️ This is already architecturally correct.

---

## STEP 3 – Blog Inputs

### “Let us understand your content”

This step **does not exist explicitly** in your epics yet — but it fits cleanly.

### Maps to:

**Epic 33 (extended org configuration)**

| Input          | Storage                                          |
| -------------- | ------------------------------------------------ |
| Sitemap URL    | `organizations.blog_config.sitemap_url`          |
| Blog root      | `organizations.blog_config.blog_root`            |
| Best articles  | `organizations.blog_config.reference_articles[]` |
| GSC connection | `integrations.google_search_console`             |

🔑 Important Insight
This step is **configuration**, not research.

It should:

* NOT trigger crawling yet
* NOT generate keywords yet
* ONLY store signals for later agents

✔️ Correct to allow “Skip & add later”

---

## STEP 4 – Article Rules (Global Settings)

This is a **big missing piece** in the current system — and you’ve designed it correctly.

### Maps to:

**Epic 33 – Organization Content Defaults**

| Setting                   | Used by               |
| ------------------------- | --------------------- |
| Language                  | Content Writing Agent |
| Tone/style                | Content Writing Agent |
| Internal links            | Content Writing Agent |
| Auto-publish              | Article queue logic   |
| Global instructions       | Prompt system         |
| Image style + brand color | Media generation      |
| Enhancements toggles      | Article pipeline      |

🔑 Key Point
These are **global defaults**, not per-article overrides.

✔️ Belongs in `organizations.content_defaults`

---

## STEP 5 – Keywords

This is where alignment matters most.

### Expected Behavior (Correct)

* Configure **how** keywords will be generated
* NOT actually generate keywords yet

### Maps to:

**Epic 33 (configuration)**
**NOT Epic 35 execution**

| Input                | Purpose                          |
| -------------------- | -------------------------------- |
| Region               | SERP localization                |
| Auto-generate toggle | Controls Research Agent behavior |

🔑 Critical Rule
No keyword research runs during onboarding.

Keyword generation starts only when:

> An **intent workflow is created and executed**

✔️ This preserves Epic 35 integrity.

---

## STEP 6 – Integration

### Maps to:

**Platform Integration Layer (outside Intent Engine execution)**

| Integration             | Use                |
| ----------------------- | ------------------ |
| WordPress, Webflow, etc | Article publishing |
| Mapping fields          | Publishing adapter |
| Skip allowed            | ✔️ correct         |

🔑 Key Point
Integration ≠ content generation.

This should:

* Be optional
* Be reusable across workflows
* Not block onboarding completion

✔️ Correct design.

---

# 4. What Changes vs What Stays

## ✅ What STAYS (Do NOT Touch)

* Auth flow
* OTP verification
* Org creation
* Payments
* Dashboard guards
* Legacy article system (isolated)

---

## 🔄 What CHANGES

### 1. Dashboard becomes gated

After `/dashboard`:

* If `organization.onboarding_completed = false`
* Redirect to `/onboarding/business`

### 2. “Create Article” is disabled

Until:

* Onboarding completed
* Intent Engine enabled
* Workflow created

### 3. Onboarding is NOT a workflow

This is important.

Onboarding:

* Configures the organization
* Prepares inputs
* Does NOT advance `intent_workflows.status`

---

# 5. Execution Plan (Step-by-Step, Safe)

### Phase 1 – Data Model Alignment

* Add:

```ts
organizations.onboarding_completed boolean
organizations.blog_config jsonb
organizations.content_defaults jsonb
organizations.keyword_settings jsonb
```

### Phase 2 – Route Guards

* `/dashboard` → redirect to onboarding if incomplete
* Feature buttons disabled until onboarding done

### Phase 3 – Onboarding Agent (Lightweight)

* Only used for:

  * Website → business auto-fill
* NOT for ICP generation yet

### Phase 4 – Lock Entry to Intent Engine

Only after onboarding completion:

* Allow “Create Intent Workflow”
* Begin Epic 34 execution

---

# 6. Final Alignment Statement

You are doing this **correctly**:

* This onboarding feeds the Intent Engine
* It does not replace it
* It does not shortcut it
* It makes Epic 33 real instead of theoretical

Nothing in your proposed onboarding conflicts with Epics 33–39.
In fact, it **completes Epic 33 properly** for the first time.

---

Perfect. We’re aligned, so now I’ll **execute this in the exact order you asked**, with **production-grade specificity** and **zero ambiguity**.

Everything below is **within Epic 33–39 only** and **does not touch the legacy system**.

---

# 1️⃣ DATA MODEL CHANGES (SQL-LEVEL)

These changes **extend** your current schema.
No breaking migrations. No rewrites.

---

## 1.1 Organizations Table (Core Onboarding State)

### New Columns

```sql
ALTER TABLE organizations
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE organizations
ADD COLUMN website_url TEXT;

ALTER TABLE organizations
ADD COLUMN business_description TEXT;

ALTER TABLE organizations
ADD COLUMN target_audiences TEXT[];

ALTER TABLE organizations
ADD COLUMN blog_config JSONB DEFAULT '{}'::jsonb;

ALTER TABLE organizations
ADD COLUMN content_defaults JSONB DEFAULT '{}'::jsonb;

ALTER TABLE organizations
ADD COLUMN keyword_settings JSONB DEFAULT '{}'::jsonb;
```

---

### Column Purpose (Non-Negotiable)

| Column               | Purpose                            |
| -------------------- | ---------------------------------- |
| onboarding_completed | Hard gate before Intent workflows  |
| website_url          | Primary AI research seed           |
| business_description | Used in **all** prompts            |
| target_audiences     | ICP seed, not final ICP            |
| blog_config          | Sitemap, blog root, reference URLs |
| content_defaults     | Global article rules               |
| keyword_settings     | Region + auto-generation rules     |

---

## 1.2 Competitors (Already Correct)

You already have this right:

```sql
organization_competitors (
  organization_id,
  url,
  domain
)
```

✔ No changes needed
✔ Org-scoped, persistent across workflows

---

## 1.3 Integrations (Optional, If Not Present)

```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  provider TEXT NOT NULL,
  config JSONB NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 1.4 Intent Workflows (Explicit Engine Version)

```sql
ALTER TABLE intent_workflows
ADD COLUMN engine_version TEXT DEFAULT 'intent';
```

This **prevents legacy bleed-through forever**.

---

# 2️⃣ ROUTE & GUARD LOGIC

This is where alignment usually breaks. We will not let that happen.

---

## 2.1 New Guard: OnboardingGuard

### Logic (Pseudo)

```ts
if (!organization.onboarding_completed) {
  redirect('/onboarding/business')
}
```

---

## 2.2 Guard Application Map

| Route                    | Guard           |
| ------------------------ | --------------- |
| /dashboard               | OnboardingGuard |
| /articles                | OnboardingGuard |
| /keywords                | OnboardingGuard |
| /intent/workflows/create | OnboardingGuard |
| /legacy/*                | ❌ no guard      |

---

## 2.3 Allowed Routes Without Onboarding

✔ /onboarding/*
✔ /billing
✔ /settings
✔ /logout

---

## 2.4 Disable Shortcuts

Until onboarding is complete:

* “Create Article” → disabled
* “Keyword Research” → disabled
* Any direct API call → `403 ONBOARDING_INCOMPLETE`

---

# 3️⃣ ONBOARDING AGENT – API DESIGN

This agent is **NOT** part of the Intent Engine execution.

It is a **pre-intent normalizer**.

---

## 3.1 Agent Scope (Strict)

The Onboarding Agent may:

* Read website
* Enrich business data
* Suggest audiences
* Normalize descriptions

The Onboarding Agent may NOT:

* Generate ICP documents
* Create workflows
* Generate keywords
* Write content

---

## 3.2 API Endpoints

### 3.2.1 Autocomplete Business

```http
POST /api/onboarding/autocomplete-business
```

**Input**

```json
{
  "website_url": "https://example.com",
  "linkedin_url": "optional"
}
```

**Process**

* Firecrawl / Perplexity Sonar
* Extract brand, services, tone
* Generate structured summary

**Output**

```json
{
  "business_name": "",
  "description": "",
  "target_audiences": [],
  "pain_points": [],
  "goals": []
}
```

---

### 3.2.2 Save Business Step

```http
POST /api/onboarding/business
```

Persists:

* website_url
* business_description
* target_audiences

---

### 3.2.3 Save Competitors

```http
POST /api/onboarding/competitors
```

Validation:

* Min 3
* Max 7
* Domain normalization

---

### 3.2.4 Save Blog Config

```http
POST /api/onboarding/blog
```

Stores `organizations.blog_config`.

---

### 3.2.5 Save Article Rules

```http
POST /api/onboarding/content-defaults
```

Stores `organizations.content_defaults`.

---

### 3.2.6 Save Keyword Settings

```http
POST /api/onboarding/keyword-settings
```

Stores `organizations.keyword_settings`.

---

### 3.2.7 Complete Onboarding

```http
POST /api/onboarding/complete
```

Validation:

* Required steps complete

Effect:

```sql
onboarding_completed = TRUE
```

---

# 4️⃣ UX → WORKFLOW TRANSITION DIAGRAM

This is the **single most important conceptual lock-in**.

---

## 4.1 Full System Flow

```
AUTH / BILLING
      ↓
ORGANIZATION CREATED
      ↓
ONBOARDING (Epic 33 – CONFIG ONLY)
──────────────────────────────────
Business
Competitors
Blog
Article Rules
Keyword Settings
Integration
──────────────────────────────────
      ↓
onboarding_completed = true
      ↓
CREATE INTENT WORKFLOW
      ↓
Epic 34–39 EXECUTION
(Onboarding Agent exits permanently)
```

---

## 4.2 Ownership Boundary

| Phase              | Owner          |
| ------------------ | -------------- |
| Onboarding         | Organization   |
| Workflow execution | Intent Engine  |
| Keyword research   | Research Agent |
| Content writing    | Content Agent  |

**No overlap. No ambiguity.**

---

## 4.3 Why This Matters

* Onboarding is **idempotent**
* Workflows are **repeatable**
* ICP is **generated once per workflow**, not guessed early
* You can onboard once, create 100 workflows cleanly

---

# 🔒 FINAL LOCK-IN STATEMENT

You now have:

✔ Clean SQL extensions
✔ Hard routing guards
✔ A scoped, safe Onboarding Agent
✔ A non-leaky transition into the Intent Engine

Nothing here conflicts with Epics 33–39.
Nothing touches the legacy system.

---

Perfect — this is the **right moment** to lock UX rules, because once onboarding ships, visual drift is hard to undo.

Below is a **clean, copy-pasteable instruction set** you can give directly to your **UX Agent / UI Designer**.
It is opinionated, explicit, and aligned with the Intent Engine philosophy.

---

# 🎨 UX AGENT INSTRUCTIONS

**Onboarding Flow – Brand-Consistent Implementation**

## 0. Core Principle (Non-Negotiable)

> The onboarding experience must feel like **one continuous, branded journey**, not a multi-form wizard.

* Same color system
* Same button hierarchy
* Same spacing, typography, and motion
* No visual resets between steps

If a user screenshots Step 1 and Step 6, they should *clearly belong to the same product*.

---

## 1. Brand Color & Theme Rules

### 1.1 Primary Brand Color

* Use the **existing primary brand color** as:

  * Primary CTA background
  * Active step indicator
  * Focus ring for inputs
  * Toggle “ON” state
* Do **not** introduce new accent colors.

If brand color is configurable later, onboarding still uses the **current org brand color**.

---

### 1.2 Color Usage Hierarchy

| Element        | Color Rule                       |
| -------------- | -------------------------------- |
| Primary CTA    | Solid brand color                |
| Secondary CTA  | Outline, brand color border      |
| Disabled CTA   | Neutral gray, no opacity tricks  |
| Active step    | Brand color                      |
| Completed step | Brand color (lighter shade)      |
| Info boxes     | Soft green / neutral (non-brand) |
| Errors         | Standard error red (system-wide) |

❌ No gradients
❌ No random highlight colors
❌ No per-step color themes

---

## 2. Buttons (Extremely Important)

### 2.1 Button Types (Only These)

#### Primary Button

* Background: Brand color
* Text: White
* Border radius: Same as rest of app
* Usage:

  * “Save Information”
  * “Save Competitors”
  * “Next Step”
  * “Complete Setup”

#### Secondary Button

* Background: Transparent
* Border: 1px solid brand color
* Text: Brand color
* Usage:

  * “Skip & Add Later”
  * “Back”

❌ No ghost buttons
❌ No text-only CTAs in onboarding

---

### 2.2 Button Behavior Rules

* One **primary CTA per screen**
* Primary CTA always bottom-right or bottom-center
* Disabled state must explain *why* (tooltip or helper text)
* Loading state replaces label with spinner + “Saving…”

---

## 3. Stepper (Navigation Spine)

### 3.1 Stepper Design

* Horizontal stepper at the top of every onboarding screen
* Fixed steps, same order always:

```
Business → Competitors → Blog → Articles → Keywords → Integration
```

### 3.2 Stepper States

| State     | Visual                   |
| --------- | ------------------------ |
| Completed | Brand color + check icon |
| Current   | Brand color + bold label |
| Upcoming  | Neutral gray             |

❌ Stepper is NOT clickable
❌ No skipping ahead visually

Stepper is **progress feedback**, not navigation.

---

## 4. Layout & Spacing Rules

### 4.1 Page Structure (All Steps)

```
[Stepper]
[Title + short explanatory copy]
[Main content card]
[Primary / Secondary actions]
```

* Max content width: same as dashboard forms
* All forms live inside **one main card**
* White background, subtle shadow
* Consistent padding across steps

---

## 5. Form Inputs (Consistency Rules)

### 5.1 Inputs

* Use existing input components
* Same border radius as rest of app
* Focus state = brand color ring
* Labels always above inputs

### 5.2 Tag Inputs (Audiences, Competitors)

* Chips use:

  * Light brand tint background
  * Brand color text
* Removable with “x”
* Keyboard friendly (Enter to add)

---

## 6. AI-Assisted Actions (Autocomplete With AI)

### Button Style

* Secondary button style
* Small “✨ AI” icon allowed
* Positioned near Website URL field

### Behavior

* Loading skeleton inside form
* Fields populate progressively
* User can edit everything

❌ Never lock AI-filled fields
❌ Never auto-advance after AI completes

---

## 7. Informational UI (Trust & Clarity)

### Info Boxes

* Used in Competitors, Blog, Integration steps
* Soft green or neutral background
* Left border accent (thin)
* Clear bullet points

Purpose:

> Explain *why* we ask, not *what* to enter.

---

## 8. Skip Logic (UX Clarity)

For optional steps:

* “Skip & add later” must:

  * Be secondary button
  * Clearly state this can be changed later
  * Never look like an error or warning

Skipping should **never feel risky**.

---

## 9. Completion Moment (Psychological Payoff)

Final step should:

* Confirm setup is complete
* Reinforce value (“You’re ready to create intent-driven content”)
* CTA:

  * “Create Your First Content Workflow”

This CTA transitions into **Intent Engine (Epic 34)**.

---

## 10. What NOT To Do (Hard No)

❌ Do not introduce a new onboarding theme
❌ Do not restyle buttons per step
❌ Do not use different card styles
❌ Do not use emojis in onboarding
❌ Do not expose workflow step numbers (Epic 33–39 are internal)

---

## 11. One-Line UX Philosophy (Give This to the Agent)

> “Onboarding should feel like configuring a powerful machine, not filling out a survey.”

## 🎨 **Complete Color Theme & Typography System**

Here's the comprehensive design system for Infin8Content:

---

## 🎯 **Core Brand Colors**

### **Primary Brand Colors**
```css
--brand-electric-blue: #217CEB;    /* Primary Blue */
--brand-infinite-purple: #4A42CC;   /* Secondary Purple */
--brand-deep-charcoal: #2C2C2E;     /* Text/Primary */
--brand-soft-light-gray: #F4F4F6;  /* Background/Secondary */
--brand-white: #FFFFFF;             /* White */
```

### **Color Palettes**

#### **Blue Spectrum**
```css
--blue-50:   #EFF6FF;  /* Lightest */
--blue-100:  #DBEAFE;
--blue-500:  #217CEB;  /* Primary */
--blue-600:  #1D6FD1;
--blue-700:  #1956A6;
--blue-900:  #0F2E5C;  /* Darkest */
```

#### **Purple Spectrum**
```css
--purple-50:  #FAF5FF;  /* Lightest */
--purple-100: #F3E8FF;
--purple-500: #4A42CC;  /* Primary */
--purple-600: #3E38A8;
--purple-700: #332D85;
--purple-900: #1E1A4F;  /* Darkest */
```

#### **Neutral Spectrum**
```css
--neutral-50:  #FAFAFA;  /* Lightest */
--neutral-100: #F4F4F6;
--neutral-200: #E5E5E7;
--neutral-500: #71717A;
--neutral-600: #52525B;
--neutral-800: #2C2C2E;
--neutral-900: #1C1C1E;  /* Darkest */
```

---

## 🌈 **Gradients**

### **Brand Gradients**
```css
--gradient-brand:    linear-gradient(to right, #217CEB, #4A42CC);
--gradient-light:    linear-gradient(to right, #EFF6FF, #FAF5FF);
--gradient-vibrant:  linear-gradient(135deg, #217CEB 0%, #4A42CC 50%, #332D85 100%);
--gradient-mesh:     radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 0.12) 0px, transparent 50%),
                     radial-gradient(at 97% 21%, hsla(265, 87%, 54%, 0.12) 0px, transparent 50%);
```

---

## 🎨 **Semantic Colors**

```css
--color-success: #22C55E;  /* Green */
--color-warning: #F59E0B;  /* Yellow/Orange */
--color-error:   #EF4444;  /* Red */
--color-info:    #06B6D4;  /* Cyan */
```

---

## 💎 **Typography System**

### **Font Families**
```css
--font-poppins: var(--font-poppins), 'Poppins', sans-serif;  /* Headings */
--font-lato:    var(--font-lato), 'Lato', sans-serif;        /* Body */
--font-geist-sans: var(--font-geist-sans), sans-serif;       /* UI */
--font-geist-mono: var(--font-geist-mono), monospace;        /* Code */
```

### **Typography Scale**

#### **Headings (Responsive)**
```css
/* H1 - Desktop: 3-4rem, Mobile: 2-2.5rem */
--text-h1-desktop: clamp(3rem, 5vw, 4rem);
--text-h1-mobile:  clamp(2rem, 5vw, 2.5rem);

/* H2 - Desktop: 2.25-3rem, Mobile: 1.75-2rem */
--text-h2-desktop: clamp(2.25rem, 4vw, 3rem);
--text-h2-mobile:  clamp(1.75rem, 4vw, 2rem);

/* H3 - Desktop: 1.5-2rem, Mobile: 1.25-1.5rem */
--text-h3-desktop: clamp(1.5rem, 3vw, 2rem);
--text-h3-mobile:  clamp(1.25rem, 3vw, 1.5rem);
```

#### **Body Text**
```css
--text-body:  1rem;    /* 16px */
--text-large: 1.125rem; /* 18px */
--text-small: 0.875rem; /* 14px */
```

#### **Fixed Sizes (UX Spec)**
```css
--font-h1:          48px;
--font-h2:          36px;
--font-h3:          28px;
--font-h4:          22px;
--font-body:        16px;
--font-body-small:  14px;
--font-small:       14px;
--font-caption:     12px;
--font-label:       13px;
```

### **Font Weights**
```css
--font-weight-light:    300;
--font-weight-normal:   400;
--font-weight-medium:   500;
--font-weight-semibold: 600;
--font-weight-bold:     700;
```

---

## 🎯 **Design Tokens**

### **Spacing System**
```css
--space-xs:   0.5rem;  /* 8px */
--space-sm:   0.75rem; /* 12px */
--space-md:   1rem;    /* 16px */
--space-lg:   1.5rem;  /* 24px */
--space-xl:   2rem;    /* 32px */
--space-2xl:  3rem;    /* 48px */
--space-3xl:  4rem;    /* 64px */
--space-4xl:  5rem;    /* 80px */
```

### **Border Radius**
```css
--radius-sm:   4px;
--radius-md:   8px;
--radius-lg:   12px;
--radius-xl:   16px;
--radius-2xl:  24px;
--radius-full: 9999px;
```

### **Shadow System**
```css
--shadow-sm:    0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-md:    0 4px 6px rgba(0, 0, 0, 0.07);
--shadow-lg:    0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl:    0 20px 25px rgba(0, 0, 0, 0.12);
--shadow-brand: 0 10px 25px rgba(33, 124, 235, 0.15);
--shadow-purple: 0 10px 25px rgba(74, 66, 204, 0.15);
```

### **Glow Effects**
```css
--glow-blue:   0 0 20px rgba(33, 124, 235, 0.3);
--glow-purple:  0 0 20px rgba(74, 66, 204, 0.3);
```

---

## 🌓 **Dark Mode Support**

### **Light Mode (Default)**
```css
--background: oklch(1 0 0);           /* White */
--foreground: oklch(0.141 0.005 285.823); /* Dark text */
--primary: oklch(0.21 0.006 285.885);    /* Blue */
--card: oklch(1 0 0);                   /* White cards */
```

### **Dark Mode**
```css
--background: oklch(0.141 0.005 285.823); /* Dark background */
--foreground: oklch(0.985 0 0);           /* Light text */
--primary: oklch(0.92 0.004 286.32);      /* Lighter blue */
--card: oklch(0.21 0.006 285.885);       /* Dark cards */
```

---

## 🎨 **Utility Classes**

### **Typography Utilities**
```css
.font-poppins     { font-family: var(--font-poppins); }
.font-lato        { font-family: var(--font-lato); }
.text-h1-desktop  { font-size: var(--text-h1-desktop); font-weight: 700; }
.text-h1-mobile   { font-size: var(--text-h1-mobile); font-weight: 700; }
.text-body        { font-size: var(--text-body); font-family: var(--font-lato); }
```

### **Color Utilities**
```css
.text-neutral-900 { color: var(--neutral-900); }
.bg-neutral-50    { background-color: var(--neutral-50); }
.bg-gradient-brand { background: var(--gradient-brand); }
```

### **Button Utilities**
```css
.btn-primary {
  background: var(--gradient-brand);
  color: var(--brand-white);
  padding: 1rem 2rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-brand);
}

.btn-secondary {
  background: transparent;
  color: var(--blue-500);
  border: 2px solid var(--blue-500);
  padding: 1rem 2rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: all 0.3s ease;
}
```

---

## 📱 **Responsive Design**

### **Breakpoints**
- **Mobile**: ≤ 768px
- **Desktop**: ≥ 769px

### **Responsive Typography**
```css
@media (max-width: 768px) {
  .text-h1-responsive { font-size: var(--text-h1-mobile); }
  .text-h2-responsive { font-size: var(--text-h2-mobile); }
  .text-h3-responsive { font-size: var(--text-h3-mobile); }
}

@media (min-width: 769px) {
  .text-h1-responsive { font-size: var(--text-h1-desktop); }
  .text-h2-responsive { font-size: var(--text-h2-desktop); }
  .text-h3-responsive { font-size: var(--text-h3-desktop); }
}
```

---

## 🎯 **Tailwind Integration**

### **Extended Tailwind Colors**
```typescript
colors: {
  brandBlue: "var(--brand-electric-blue)",
  brandPurple: "var(--brand-infinite-purple)",
  charcoal: "var(--ui-charcoal)",
  lightGray: "var(--ui-light-gray)",
  primary: {
    DEFAULT: "var(--color-primary-blue)",
  },
}
```

### **Extended Backgrounds**
```typescript
backgroundImage: {
  brandGradient: "var(--brand-gradient)",
}
```

---

## 🚀 **Usage Examples**

### **Headings**
```jsx
<h1 className="text-h1-desktop font-poppins text-neutral-900">Main Title</h1>
<h2 className="text-h2-mobile font-poppins text-neutral-800">Subtitle</h2>
<p className="text-body font-lato text-neutral-600">Body text</p>
```

### **Buttons**
```jsx
<button className="btn-primary">Primary Action</button>
<button className="btn-secondary">Secondary Action</button>
```

### **Cards**
```jsx
<div className="card bg-white shadow-md">
  <h3 className="text-h3-desktop font-poppins">Card Title</h3>
  <p className="text-body font-lato">Card content</p>
</div>
```

### **Gradients**
```jsx
<div className="bg-gradient-brand text-white">Brand gradient</div>
<div className="bg-gradient-light text-neutral-900">Light gradient</div>
```

This comprehensive design system ensures consistency across the entire Infin8Content platform! 🎨✨

Perfect — this is already **very solid**, so what you’re really asking for now is a **clean, deterministic implementation plan** that stitches:

Planner → Research → Writing → Assembly → WordPress
into **one irreversible, stepwise pipeline** with zero ambiguity.

Below is the **implementation blueprint**. This is not conceptual — this is **build order + contracts + orchestration**.

---

# ✅ Deterministic Section-by-Section Article Pipeline

**Implementation Plan (Locked)**

This plan assumes:

* Planner Agent is DONE
* WordPress integration is DONE
* We are implementing **Research Agent + Content Writing Agent + Orchestration glue**

No deviations from this plan.

---

## 1️⃣ High-Level Architecture (Single Article)

```
Article (queued)
  ↓
Planner Agent (already implemented)
  ↓
Section Loop (sequential, strict order)
  ├─ Research Agent (Perplexity Sonar)
  ├─ Persist research
  ├─ Content Writing Agent
  ├─ Persist section content
  └─ Append to Temporary Article
  ↓
Final Assembly
  ↓
Markdown + HTML output
  ↓
Article status = completed
  ↓
WordPress publish (manual or auto)
```

---

## 2️⃣ Data Model Additions (Minimal & Necessary)

### 2.1 Article Sections Table (Optional but Recommended)

If you want **full observability and retries per section**:

```sql
CREATE TABLE article_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  section_order INTEGER NOT NULL,
  section_header TEXT NOT NULL,
  section_type TEXT NOT NULL,
  planner_payload JSONB NOT NULL,
  research_payload JSONB,
  content_markdown TEXT,
  content_html TEXT,
  status TEXT CHECK (
    status IN (
      'pending',
      'researching',
      'researched',
      'writing',
      'completed',
      'failed'
    )
  ) DEFAULT 'pending',
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_article_sections_unique
ON article_sections(article_id, section_order);
```

If you want simpler:
You can store everything inside `articles.article_structure[]` — but observability will suffer.

---

## 3️⃣ Section Execution Contract (CRITICAL)

Every section **must** pass through this exact state machine:

```
pending
→ researching
→ researched
→ writing
→ completed
```

Failures never advance the article.

---

## 4️⃣ Research Agent Implementation

### 4.1 Trigger

Triggered **per section**, never globally.

```ts
event: article.section.research
payload:
{
  article_id,
  section_id,
  section_order,
  section_header,
  supporting_points,
  research_questions,
  article_structure_context
}
```

### 4.2 Execution Rules

* Use **Perplexity Sonar**
* Use the **prompt exactly as-is**
* Max 10 searches
* Consolidate overlapping questions
* No summarisation or truncation
* Capture **full Perplexity answers + citations**

### 4.3 Persist Output

```ts
UPDATE article_sections
SET
  research_payload = { full_response },
  status = 'researched'
WHERE id = section_id
```

If failure:

```ts
status = 'failed'
error_details = { message, stage: 'research' }
```

---

## 5️⃣ Content Writing Agent Implementation

### 5.1 Trigger

Triggered **only after research completes** for that section.

```ts
event: article.section.write
payload:
{
  article_id,
  section_id,
  section_order,
  planner_section,
  research_payload,
  temporary_article_so_far,
  icp_context
}
```

---

### 5.2 Writing Rules (Hard)

* Write **ONLY this section**
* Must:

  * Follow planner structure
  * Use research citations (markdown links)
  * Match word count ±20%
  * Use third-grade reading level
  * No jargon, no em dashes
* Output **ONLY content**, no commentary

---

### 5.3 Persist Output

```ts
UPDATE article_sections
SET
  content_markdown = markdown,
  content_html = html,
  status = 'completed'
WHERE id = section_id
```

Append to article-level temporary buffer:

```ts
UPDATE articles
SET temporary_article = temporary_article || '\n\n' || markdown
WHERE id = article_id
```

---

## 6️⃣ Sequential Orchestration (Most Important Part)

### 6.1 Inngest Function: Section Loop

Pseudo-flow:

```ts
for section in article_structure ORDER BY section_order:
  await runResearch(section)
  await runWriter(section, temporary_article_so_far)
```

Rules:

* ❌ No parallel sections
* ❌ No skipping
* ❌ No batch writing
* ❌ No speculative generation

This guarantees:

* Narrative continuity
* Terminology consistency
* Tone stability

---

## 7️⃣ Final Section Handling

Before the **last section only**:

Payload must include:

```ts
full_article_so_far = all_previous_sections_combined
```

This ensures:

* Proper conclusion
* No repetition
* Clean wrap-up CTA

---

## 8️⃣ Final Assembly Step

Once all sections are `completed`:

### 8.1 Assemble Article

```ts
SELECT content_markdown, content_html
FROM article_sections
WHERE article_id = ?
ORDER BY section_order
```

Store on article:

```ts
UPDATE articles
SET
  final_markdown = joined_markdown,
  final_html = joined_html,
  status = 'completed',
  completed_at = now()
WHERE id = article_id
```

---

## 9️⃣ Publishing Integration (Already Done)

Your existing WordPress adapter slots in **unchanged**:

* Uses `final_html`
* Enforces idempotency
* Feature-flag protected
* Safe retry

No changes required here.

---

## 🔒 Non-Negotiable Guarantees

This pipeline guarantees:

* Deterministic execution
* Full auditability
* Section-level retries
* Zero hallucinated research
* No content drift
* CMS-safe output

---
Good catch — and you’re **100% right to call this out**.

I didn’t include the **system + user input blocks** earlier because I was focusing on **pipeline orchestration and contracts**, not the **LLM execution layer**. But you’re correct: without explicitly locking **system prompts + user payloads**, the pipeline is **not deterministic**.

So let’s fix that properly now.

Below is the **missing piece**:
**exact system + user inputs** for **both the Research Agent and the Content Writing Agent**, aligned *exactly* with your rules.

No rewrites. No improvisation. Just wiring.

---

# 🔍 Research Agent – Prompt Wiring (LOCKED)

## 1️⃣ Research Agent – System Prompt

This is injected as the **system role** and must never change.

```text
Role
You are an expert Research Analyst specialized in conducting targeted research using multiple web searches. Your purpose is to analyze research questions, consolidate overlapping queries, and gather diverse, high-quality sources that support specific points with actionable conclusions.

Constraints
• Analyze and consolidate research questions to eliminate redundancy
• Execute up to 10 individual Perplexity searches based on consolidated questions
• Prioritize diverse source types (YouTube videos, data tables, studies, news articles, social media)
• Always provide working links with every source
• Each source summary must include a clear conclusion
• Focus on recent sources (last 12 months) when available
• Maintain objectivity while supporting the provided points
• Do not fabricate information not found in sources
• For each research question, provide the complete Perplexity answer and all citations

Inputs
• Research Questions: Specific questions to be researched directly through Perplexity
• Supporting Points: Key points that need research backing and evidence
• Additional Context: {{ $json.output.article_structure.toJsonString() }}
Tools
1. Perplexity_Tool - Searches the web using Perplexity with parameters:
• searchTerm (required - specific query for web search)

Instructions

Step 1: Question Analysis
• Review all incoming research questions
• Identify overlapping themes and topics
• Consolidate similar questions to avoid redundant searches
• Create a streamlined list of unique research angles

Step 2: Strategic Search Execution
• Execute up to 10 targeted Perplexity searches based on consolidated questions
• Vary search terms to capture different source types:
  • "[topic] statistics data tables"
  • "[topic] YouTube video explanations"
  • "[topic] recent studies research"
  • "[topic] case studies examples"
  • "[topic] news updates 2024/2025"
• Focus searches on supporting the provided supporting points

Step 3: Complete Answer Documentation
• For each research question searched, document:
  • Original Research Question: The exact question or search term used
  • Complete Perplexity Answer: The full response provided by Perplexity (not summarized)
  • All Citations: Every URL, source, and reference provided in the Perplexity response
  • Source Analysis: Brief note on source diversity and relevance to supporting points

Conclusions

The output must follow this exact format for each research question:

Research Question #1: [Exact question/search term]  
Perplexity Answer: [Complete, unedited response from Perplexity]  
Citations: [All URLs and sources provided by Perplexity]

Research Question #2: [Exact question/search term]  
Perplexity Answer: [Complete, unedited response from Perplexity]  
Citations: [All URLs and sources provided by Perplexity]

[Continue for all research questions up to 10]

Summary of Source Types Found: Overview of diversity in sources discovered  
Relevance to Supporting Points: How findings connect to original supporting points

Solutions
• If questions are too similar, consolidate them and explain the consolidation approach
• If fewer than 10 searches yield sufficient information, explain why additional searches weren’t needed
• If certain source types aren’t available for the topic, note this limitation
• If supporting points lack sufficient research backing, clearly identify these gaps
• If conflicting information emerges, highlight discrepancies and provide multiple perspectives
• If Perplexity responses are extensive, include them in full rather than summarizing
```

This **never** changes per section.

---

## 2️⃣ Research Agent – User Input (Per Section)

This is dynamically injected **per section**.

```text
Inputs

• Research Questions:
{{ section.research_questions }}

• Supporting Points:
{{ section.supporting_points }}

• Additional Context:
{{ article_structure_json }}

Instructions

Step 1: Question Analysis
• Review all incoming research questions
• Identify overlapping themes and topics
• Consolidate similar questions to avoid redundant searches
• Create a streamlined list of unique research angles

Step 2: Strategic Search Execution
• Execute up to 10 targeted Perplexity searches based on consolidated questions
• Vary search terms to capture different source types:
  • "[topic] statistics data tables"
  • "[topic] YouTube video explanations"
  • "[topic] recent studies research"
  • "[topic] case studies examples"
  • "[topic] news updates 2024/2025"
• Focus searches on supporting the provided supporting points

Step 3: Complete Answer Documentation
• For each research question searched, document:
  • Original Research Question
  • Complete Perplexity Answer (unmodified)
  • All citations and URLs

Output Format (JSON ONLY)

{
  "research_results": [
    {
      "question": "string",
      "answer": "string",
      "citations": "string"
    }
  ]
}
```

🔒 **Rules**

* No summarisation
* No truncation
* No rephrasing
* Raw Perplexity output only

---

# ✍️ Content Writing Agent – Prompt Wiring (LOCKED)

## 3️⃣ Content Writing Agent – System Prompt

This defines **voice, constraints, and behavior** and must never change.

```text
Role
You are an expert Blog Content Writer specializing in creating valuable, human-centered articles that educate and inform readers while naturally incorporating SEO elements. Your writing style mirrors authentic social media voices - practical, collaborative, and approachable - while delivering comprehensive information that helps readers make informed decisions.

Constraints
• Write at a third-grade reading level using simple, everyday language
• Avoid technical jargon, em dashes, and overly complex sentence structures
• Focus on providing factual information and value rather than aggressive selling
• Naturally incorporate target keywords and semantic variations without keyword stuffing
• Include diverse, properly cited sources from provided research materials using markdown links
• Maintain the specified word count for each article section (±20% tolerance)
• Use markdown formatting with tables, bullet points, and proper headers
• Keep tone conversational and engaging, not overly serious or corporate
• Include natural calls-to-action and product/service mentions where contextually appropriate
• Embed YouTube video links when referencing video content (for later embedding)
• Output only the complete article with no additional commentary or supporting text

Inputs
You will receive structured article briefs containing:

• Article title and target keyword
• Content style (informative, educational, comparative, etc.)
• Semantic keywords list for natural incorporation
• Article structure with sections including:
  • Section type and header
  • Supporting points to cover
  • Research questions and answers
  • Supporting elements and statistics
  • Estimated word count per section
• Supporting research with citations and source links
• Tone of voice guidelines for writing style consistency
• Product/service context for natural integration

Instructions

Content Creation Workflow:
1. Analyze the article structure and identify key themes, target audience, and primary value proposition
2. Review all supporting research and citation sources to understand available evidence and statistics
3. Plan content flow ensuring logical progression and natural keyword integration throughout
4. Write the introduction that hooks readers with relatable problems or compelling
5. Develop each section following the provided structure while weaving in supporting points and research naturally  
6. Incorporate citations using markdown links [descriptive text](source URL) from the research materials  
7. Add tables or structured data where appropriate to enhance readability and value  
8. Include natural CTAs that guide readers toward relevant next steps or resources  
9. Review for SEO optimization ensuring target and semantic keywords appear naturally throughout  
10. Final polish for tone consistency, readability, and flow  

Writing Style Guidelines:
• Use “we” language and collaborative tone: “Let’s figure this out together”  
• Share practical insights: “Here’s what actually works…”  
• Include relatable examples: “We’ve all been there when…”  
• Focus on business value: “This impacts your day-to-day efficiency”  
• Ask engaging questions: “What manual process is eating your time?”  
• Provide step-by-step solutions when appropriate  
• Use conversational transitions and natural language patterns  

SEO Integration:
• Include target keyword in H1 title naturally  
• Use semantic keywords in H2 and H3 headers where relevant  
• Distribute keyword variations throughout body content organically  
• Create descriptive, keyword-rich meta descriptions through compelling introductions  
• Use related terms and synonyms to build topical authority  

Citation and Source Management:
• Reference provided research answers and statistics with markdown links [descriptive text](source URL)  
• Ensure diversity of sources across different sections  
• Integrate quotes and statistics naturally within narrative flow using inline citations  
• Maintain factual accuracy while making information accessible  
• Use descriptive link text that adds context to citation
Conclusions

Your output will be a complete, publication-ready markdown blog article that:
• Delivers genuine value and actionable insights to readers  
• Naturally incorporates SEO elements without compromising readability  
• Maintains consistent tone aligned with provided voice guidelines  
• Includes proper markdown citations with source URLs  
• Features engaging, conversational writing that builds trust and authority  
• Provides clear next steps or resources for reader engagement  
• Adheres to specified word counts and structural requirements  
• Contains no additional commentary, explanations, or supporting text  

Solutions
• If research data is insufficient: Request additional sources or clarification on specific statistics needed  
• If word count requirements conflict with content depth: Prioritize value delivery and suggest section adjustments  
• If tone guidelines seem unclear: Ask for specific examples of preferred writing style or voice  
• If keyword integration feels forced: Focus on natural language first, then optimize semantically  
• If citation sources lack diversity: Request additional research materials or alternative sources
• If technical topics require simplification: Break down complex concepts using analogies and everyday examples  
• If CTA placement seems unnatural: Integrate product mentions within helpful context rather than forced promotional sections

---

## 4️⃣ Content Writing Agent – User Input (Per Section)

### First Section Input

```text
<Inputs>

Article title:
{{ planner.article_title }}

Target keyword:
{{ planner.target_keyword }}

Content style:
{{ planner.content_style }}

Semantic keywords:
{{ planner.semantic_keywords }}

Section type:
{{ section.section_type }}

Section header:
{{ section.header }}

Estimated word count:
{{ section.estimated_words }}

Key points:
{{ section.supporting_points }}

Supporting research:
{{ section.research_results }}

Product / ICP context:
{{ icp_context }}

</Inputs>
```

---

### Subsequent Sections (Context-Aware)

```text
<Inputs>

Article so far:
{{ temporary_article_markdown }}

Current section header:
{{ section.header }}

Section type:
{{ section.section_type }}

Estimated word count:
{{ section.estimated_words }}

Key points:
{{ section.supporting_points }}

Supporting research:
{{ section.research_results }}

</Inputs>
```

---

## 5️⃣ Final Section Input (Critical Difference)

For the **last section only**:

```text
<Inputs>

Full article draft so far:
{{ full_article_markdown }}

Final section header:
{{ section.header }}

Section type:
{{ section.section_type }}

Key points:
{{ section.supporting_points }}

Supporting research:
{{ section.research_results }}

</Inputs>
```

This guarantees:

* No repetition
* Proper conclusion
* Clean CTA alignment

---

# 🔁 Why This Matters (The Real Answer)

Without explicitly locking:

* **System prompts**
* **User payload structure**
* **Context injection order**

You get:

* Tone drift
* Inconsistent citations
* Broken narrative continuity
* Non-repeatable outputs

Now you don’t.

---

## ✅ Final Lock Statement

* Planner = structure authority
* Research Agent = truth authority
* Content Agent = narrative executor
* Orchestration = enforcement

This is now a **fully specified, deterministic, production-grade agent pipeline**.


Below is a **concrete, implementable fix**, not just a note saying “be careful”.

---

# ✅ Fix: Target Audiences vs ICP Naming Risk (Locked)

We’ll solve this at **three levels**:

1. **Schema comments**
2. **Type-level semantics**
3. **Runtime guardrails**

That way, future devs can’t accidentally misuse it even if they try.

---

## 1️⃣ Database-Level Fix (Authoritative Source of Truth)

### 1.1 Add Explicit Column Comments (CRITICAL)

Postgres supports column comments. Use them.

```sql
COMMENT ON COLUMN organizations.target_audiences IS
'User-provided audience hypotheses collected during onboarding.
This is NOT a validated ICP.
Used only as an input signal for later ICP generation within intent workflows.';

COMMENT ON COLUMN intent_workflows.icp_document IS
'AI-generated Ideal Customer Profile (ICP) for this specific workflow.
Derived from onboarding inputs, competitors, and research.
This is the authoritative ICP used for keyword research and content generation.';
```

This ensures:

* Anyone inspecting the DB sees the distinction
* BI tools, migrations, and future devs get the warning **in-context**

---

## 2️⃣ Code-Level Fix (Prevent Accidental Misuse)

### 2.1 Rename at the Type Layer (Recommended)

You **do not need to rename the DB column**, but you should rename it in code.

#### Example (TypeScript)

```ts
// ❌ Avoid this
target_audiences: string[]

// ✅ Use this instead
target_audience_hypotheses: string[]
```

Mapping layer:

```ts
const orgConfig = {
  target_audience_hypotheses: organization.target_audiences,
}
```

This creates a **semantic speed bump**:

* Devs stop and think
* ICP misuse becomes obvious

---

### 2.2 Add JSDoc Guards (Very Important)

Wherever this field is used:

```ts
/**
 * targetAudienceHypotheses
 *
 * Raw, user-provided audience assumptions collected during onboarding.
 * This field MUST NOT be treated as an ICP.
 *
 * It may be used ONLY as an input signal when generating
 * an ICP inside an intent workflow (Epic 34).
 *
 * Never use this field directly for:
 * - keyword validation
 * - content targeting
 * - research decisions
 */
targetAudienceHypotheses: string[]
```

And for ICP:

```ts
/**
 * icpDocument
 *
 * AI-generated, workflow-scoped Ideal Customer Profile.
 * This is the ONLY authoritative ICP and must be used for:
 * - keyword relevance checks
 * - clustering validation
 * - content planning
 * - article writing
 */
icpDocument: IcpDocument
```

---

## 3️⃣ Runtime Guardrails (Make It Impossible to Screw Up)

### 3.1 Enforce at Workflow Boundaries

Add a hard rule in code:

```ts
if (!workflow.icp_document && step > STEP_1_ICP) {
  throw new Error(
    'ICP document is required. Do not substitute target_audiences for ICP.'
  )
}
```

This prevents:

* “Quick fixes”
* Silent fallbacks
* Incorrect assumptions during crunch time

---

### 3.2 Explicit Mapping During ICP Generation

When generating ICP (Epic 34.1), be explicit:

```ts
const icpInput = {
  businessDescription: org.business_description,
  targetAudienceHypotheses: org.target_audiences, // input only
  competitors: org.competitors,
}
```

Never pass `target_audiences` downstream after this step.

---

## 4️⃣ Documentation Snippet (Drop-In for Repo)

Add this to `/docs/intent-engine.md` or equivalent:

```md
### Target Audiences vs ICP (Important)

- `organizations.target_audiences` represents **user hypotheses**
- It is collected during onboarding
- It is NOT validated and NOT authoritative

The only valid ICP is:
- `intent_workflows.icp_document`

No system component should treat target audiences as an ICP.
```

This helps onboarding new engineers.

---

## 🔒 Final Locked Rule (Canonical)

> **Target audiences are inputs.
> ICP is an output.
> They are never interchangeable.**

With these fixes:

* The naming risk is eliminated
* The intent model is enforced structurally
* Future misuse is extremely unlikely

This is now **production-safe**.

## ✅ Final Lock Statement

> Planner defines structure.
> Research validates truth.
> Writing executes value.
> Assembly guarantees coherence.
> Publishing is a consequence, not a shortcut.


Below is the **fixed, implementation-grade version** of 4.1–4.3, with **SQL, code contracts, and enforcement points**. This is now *locked*, not advisory.

---

# ✅ FIXED: Real Gaps (Now Closed)

These were implementation gaps. They are now **resolved with explicit guarantees**.

---

## 4.1 Onboarding Versioning (FIXED, NOT OPTIONAL)

### Problem (recap)

Without versioning:

* You cannot tell which orgs completed which onboarding shape
* Future onboarding changes become dangerous
* Backfills become guesswork

---

### ✅ Fix: Add Onboarding Version (Authoritative)

#### SQL (required)

```sql
ALTER TABLE organizations
ADD COLUMN onboarding_version TEXT NOT NULL DEFAULT 'v1';

COMMENT ON COLUMN organizations.onboarding_version IS
'Tracks which onboarding schema/version the organization completed.
Used to safely evolve onboarding without breaking existing orgs.';
```

---

### ✅ Runtime Usage (Mandatory)

* Onboarding completion **must write the version**
* Workflow creation **must read the version**

Example:

```ts
const CURRENT_ONBOARDING_VERSION = 'v1';

if (organization.onboarding_version !== CURRENT_ONBOARDING_VERSION) {
  throw new Error(
    'Organization onboarding is out of date. Please re-run onboarding.'
  );
}
```

This gives you:

* Safe onboarding evolution
* Controlled migrations
* Zero silent drift

---

### 🔒 Locked Rule

> **No workflow may be created unless onboarding_version matches the current expected version.**

---

## 4.2 Validation Contract for “Complete Onboarding” (FIXED)

### Problem (recap)

“Required steps complete” was undefined and UI-dependent.

That is not acceptable.

---

### ✅ Fix: Server-Side Onboarding Validator (Single Source of Truth)

#### Create a validator function (MANDATORY)

```ts
export function validateOrganizationOnboarding(org: Organization): void {
  if (!org.website_url || org.website_url.trim().length === 0) {
    throw new Error('Onboarding incomplete: website URL missing');
  }

  if (!org.business_description || org.business_description.trim().length === 0) {
    throw new Error('Onboarding incomplete: business description missing');
  }

  if (!Array.isArray(org.target_audiences) || org.target_audiences.length === 0) {
    throw new Error('Onboarding incomplete: target audiences missing');
  }

  if (!Array.isArray(org.competitors) || org.competitors.length < 3) {
    throw new Error('Onboarding incomplete: at least 3 competitors required');
  }

  if (!org.content_defaults || Object.keys(org.content_defaults).length === 0) {
    throw new Error('Onboarding incomplete: content defaults not configured');
  }

  if (!org.keyword_settings || Object.keys(org.keyword_settings).length === 0) {
    throw new Error('Onboarding incomplete: keyword settings not configured');
  }
}
```

---

### ✅ Enforce at Critical Boundaries

This validator **must** run in:

1. `POST /api/onboarding/complete`
2. `POST /api/intent/workflows/create`
3. Any internal workflow bootstrap

Example:

```ts
validateOrganizationOnboarding(organization);

await supabase
  .from('organizations')
  .update({
    onboarding_completed: true,
    onboarding_version: CURRENT_ONBOARDING_VERSION,
  })
  .eq('id', organization.id);
```

---

### 🔒 Locked Rule

> **Frontend completion ≠ onboarding completion.
> Only the server decides when onboarding is complete.**

---

## 4.3 Blog Inputs + Firecrawl Timing (FIXED)

### Problem (recap)

Firecrawl was mentioned, but timing was ambiguous.

Ambiguity here leads to:

* Premature crawling
* Expensive calls
* Polluted intent data

---

### ✅ Fix: Explicit Phase Separation (Hard Rule)

#### Onboarding Phase (Epic 33)

Blog inputs are **metadata only**:

```ts
organizations.blog_config = {
  sitemap_url,
  blog_root_url,
  reference_articles,
  gsc_connected: boolean
}
```

❌ No crawling
❌ No indexing
❌ No keyword extraction
❌ No Firecrawl calls

---

### ✅ Workflow Phase (Epic 34+)

Firecrawl **may only be invoked** when:

* An intent workflow exists
* ICP has been generated
* Workflow status ≥ `step_1_icp`

---

### ✅ Code Enforcement (Required)

Add a hard guard:

```ts
if (!workflow || workflow.status === 'step_0_auth') {
  throw new Error(
    'Firecrawl usage is forbidden during onboarding. Workflow context required.'
  );
}
```

And explicitly **forbid Firecrawl in onboarding codepaths**:

```ts
// onboarding services
// ❌ NEVER import firecrawl here
```

---

### 🔒 Locked Rule

> **Onboarding stores signals.
> Workflows execute actions.
> Firecrawl is execution-only.**

---

## ✅ Final State (All Gaps Closed)

| Gap                   | Status       |
| --------------------- | ------------ |
| Onboarding versioning | ✅ Fixed      |
| Completion validation | ✅ Fixed      |
| Blog crawl timing     | ✅ Fixed      |
| Server authority      | ✅ Enforced   |
| Future safety         | ✅ Guaranteed |

---

## Canonical Summary (Pin This)

> Onboarding is versioned, validated, and inert.
> Workflows are version-aware, validated, and active.
> Crawling and research are execution-only behaviors.

This is now **production-grade and future-proof**.

Perfect. Below is a **clean, production-grade implementation** that does exactly what you asked — no fluff, no UI assumptions, no leaky abstractions.

This is split into **two hard pieces**:

1. **Server-side onboarding validator (authoritative)**
2. **Formal onboarding → workflow transition guards (non-bypassable)**

Everything here is designed so future devs **cannot accidentally skip it**.

---

# 1️⃣ Server-Side Onboarding Validator (Authoritative)

This is the **single source of truth** for whether onboarding is complete.

> Frontend state is irrelevant.
> This validator decides.

---

## 1.1 Validator Contract

**File:** `lib/onboarding/validate-onboarding.ts`

```ts
// lib/onboarding/validate-onboarding.ts

export const CURRENT_ONBOARDING_VERSION = 'v1';

export interface OrganizationOnboardingSnapshot {
  website_url: string | null;
  business_description: string | null;
  target_audiences: string[] | null;
  competitors: string[] | null;
  content_defaults: Record<string, unknown> | null;
  keyword_settings: Record<string, unknown> | null;
  onboarding_version: string | null;
}

export class OnboardingValidationError extends Error {
  public readonly code = 'ONBOARDING_INCOMPLETE';

  constructor(message: string) {
    super(message);
  }
}

/**
 * validateOrganizationOnboarding
 *
 * This function is the ONLY authority that decides whether
 * an organization has completed onboarding.
 *
 * If this throws, onboarding is NOT complete.
 */
export function validateOrganizationOnboarding(
  org: OrganizationOnboardingSnapshot
): void {
  // --- Core business identity ---
  if (!org.website_url || org.website_url.trim().length === 0) {
    throw new OnboardingValidationError(
      'Website URL is required to complete onboarding.'
    );
  }

  if (!org.business_description || org.business_description.trim().length === 0) {
    throw new OnboardingValidationError(
      'Business description is required to complete onboarding.'
    );
  }

  // --- Audience hypotheses (NOT ICP) ---
  if (!Array.isArray(org.target_audiences) || org.target_audiences.length === 0) {
    throw new OnboardingValidationError(
      'At least one target audience is required.'
    );
  }

  // --- Competitors ---
  if (!Array.isArray(org.competitors) || org.competitors.length < 3) {
    throw new OnboardingValidationError(
      'At least 3 competitors are required.'
    );
  }

  // --- Content defaults ---
  if (
    !org.content_defaults ||
    typeof org.content_defaults !== 'object' ||
    Object.keys(org.content_defaults).length === 0
  ) {
    throw new OnboardingValidationError(
      'Content defaults must be configured.'
    );
  }

  // --- Keyword settings ---
  if (
    !org.keyword_settings ||
    typeof org.keyword_settings !== 'object' ||
    Object.keys(org.keyword_settings).length === 0
  ) {
    throw new OnboardingValidationError(
      'Keyword settings must be configured.'
    );
  }

  // --- Version enforcement ---
  if (org.onboarding_version !== CURRENT_ONBOARDING_VERSION) {
    throw new OnboardingValidationError(
      'Onboarding version mismatch. Please re-run onboarding.'
    );
  }
}
```

---

## 1.2 Where This MUST Be Used

This function **must be called** in:

* `POST /api/onboarding/complete`
* `POST /api/intent/workflows/create`
* Any internal workflow bootstrap or migration path

If it’s not called, that path is a bug.

---

# 2️⃣ Formal Onboarding → Workflow Transition Guards

This ensures **no workflow can exist without valid onboarding**.

---

## 2.1 Guard Function (Reusable, Centralized)

**File:** `lib/intent/guards/assert-onboarding-ready.ts`

```ts
// lib/intent/guards/assert-onboarding-ready.ts

import { validateOrganizationOnboarding } from '@/lib/onboarding/validate-onboarding';

export class WorkflowGuardError extends Error {
  public readonly code = 'WORKFLOW_GUARD_FAILED';

  constructor(message: string) {
    super(message);
  }
}

/**
 * assertOrganizationCanCreateWorkflow
 *
 * HARD GATE:
 * - No onboarding → no workflows
 * - No version match → no workflows
 */
export function assertOrganizationCanCreateWorkflow(
  organization: any // typed to your DB model
): void {
  try {
    validateOrganizationOnboarding({
      website_url: organization.website_url,
      business_description: organization.business_description,
      target_audiences: organization.target_audiences,
      competitors: organization.competitors,
      content_defaults: organization.content_defaults,
      keyword_settings: organization.keyword_settings,
      onboarding_version: organization.onboarding_version,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new WorkflowGuardError(
        `Cannot create workflow: ${error.message}`
      );
    }
    throw error;
  }
}
```

---

## 2.2 Enforce at Workflow Creation API

**Example:** `POST /api/intent/workflows/create`

```ts
import { assertOrganizationCanCreateWorkflow } from '@/lib/intent/guards/assert-onboarding-ready';

export async function POST(req: Request) {
  const { organization } = await loadOrgContext(req);

  // 🔒 HARD BLOCK
  assertOrganizationCanCreateWorkflow(organization);

  // Safe to proceed
  const workflow = await createIntentWorkflow({
    organization_id: organization.id,
  });

  return Response.json({ workflow });
}
```

If onboarding is incomplete:

* No workflow row
* No partial state
* No side effects

---

## 2.3 Guard Against Firecrawl / Execution Leakage

Add this **once**, and you’ll never worry again.

```ts
export function assertExecutionContext(workflow: any) {
  if (!workflow || workflow.status === 'step_0_auth') {
    throw new Error(
      'Execution is forbidden before workflow initialization and ICP generation.'
    );
  }
}
```

Usage:

* Firecrawl
* Keyword expansion
* Planner
* Research agent

---

# 3️⃣ Canonical Rules (Document These)

Add this to `/docs/intent-engine.md`:

```md
## Onboarding → Workflow Boundary (Hard Rules)

- Onboarding must be completed and validated server-side
- Onboarding is versioned
- Only validated onboarding may create workflows
- Workflows may never substitute onboarding data
- Execution services require a workflow context
```

---

# ✅ Final State (Locked)

✔ Onboarding completion is **provable**
✔ Workflow creation is **guarded**
✔ Execution cannot leak into onboarding
✔ Version drift is **detectable**
✔ Future onboarding changes are **safe**

---


