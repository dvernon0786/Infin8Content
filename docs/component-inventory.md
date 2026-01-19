# UI Component Inventory

Generated: 2026-01-19 (Updated)  
Project: Infin8Content  
Framework: Next.js 16.1.1 with TypeScript  
Total Components: 37 (+9 UX Landing Page Components)

---

## Component Architecture Overview

Infin8Content uses a modular component architecture with clear separation between reusable UI components and application-specific components. The design system is built on Radix UI primitives with Tailwind CSS for styling.

## Component Categories

### Base UI Components (`/components/ui`)

Reusable design system components based on Radix UI primitives.

#### Avatar
**Path:** `/components/ui/avatar.tsx`  
**Purpose:** User profile image display  
**Props:** `src`, `alt`, `fallback`, `size`  
**Usage:** Profile headers, team member lists

#### Button
**Path:** `/components/ui/button.tsx`  
**Purpose:** Interactive button element  
**Props:** `variant`, `size`, `disabled`, `children`  
**Variants:** `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`  
**Usage:** Forms, navigation, actions

#### Dialog
**Path:** `/components/ui/dialog.tsx`  
**Purpose:** Modal dialog overlay  
**Props:** `open`, `onOpenChange`, `children`  
**Usage:** Confirmation dialogs, forms, detailed views

#### Dropdown Menu
**Path:** `/components/ui/dropdown-menu.tsx`  
**Purpose:** Context menu with actions  
**Props:** `children`, `items`  
**Usage:** User menus, settings, actions

#### Progress
**Path:** `/components/ui/progress.tsx`  
**Purpose:** Progress indicator bar  
**Props:** `value`, `max`, `className`  
**Usage:** Article generation progress, upload status

#### Separator
**Path:** `/components/ui/separator.tsx`  
**Purpose:** Visual divider element  
**Props:** `orientation`, `className`  
**Usage:** Layout separation, content grouping

#### Slot
**Path:** `/components/ui/slot.tsx`  
**Purpose:** Component composition utility  
**Props:** `children`, `className`  
**Usage:** Component composition patterns

#### Tooltip
**Path:** `/components/ui/tooltip.tsx`  
**Purpose:** Hover information tooltip  
**Props:** `children`, `content`, `delay`  
**Usage:** Help text, additional information

### Application Components (`/components`)

#### Article Components (`/components/articles/`)

**Article Card**
**Path:** `/components/articles/article-card.tsx`  
**Purpose:** Display article summary in grid/list  
**Props:** `article`, `onEdit`, `onDelete`, `onView`  
**Features:** Status indicators, progress bars, action buttons

**Article Editor**
**Path:** `/components/articles/article-editor.tsx`  
**Purpose:** Rich text article editing interface  
**Props:** `article`, `onSave`, `onCancel`  
**Features:** Real-time preview, auto-save, formatting tools

**Article Generator**
**Path:** `/components/articles/article-generator.tsx`  
**Purpose:** AI content generation interface  
**Props:** `onGenerate`, `generating`, `progress`  
**Features:** Topic input, tone selection, progress tracking

**Article List**
**Path:** `/components/articles/article-list.tsx`  
**Purpose:** Paginated article listing  
**Props:** `articles`, `loading`, `onLoadMore`  
**Features:** Search, filter, pagination, bulk actions

**Article Preview**
**Path:** `/components/articles/article-preview.tsx`  
**Purpose:** Article content preview  
**Props:** `content`, `title`, `metadata`  
**Features:** Markdown rendering, metadata display

**Article Status**
**Path:** `/components/articles/article-status.tsx`  
**Purpose:** Generation status indicator  
**Props:** `status`, `progress`, `error`  
**Features:** Real-time updates, error messages

#### Dashboard Components (`/components/dashboard/`)

**Dashboard Header**
**Path:** `/components/dashboard/dashboard-header.tsx`  
**Purpose:** Main dashboard navigation header  
**Props:** `user`, `organization`, `onLogout`  
**Features:** User menu, organization switcher, navigation

**Usage Stats**
**Path:** `/components/dashboard/usage-stats.tsx`  
**Purpose:** Usage statistics display  
**Props:** `stats`, `period`  
**Features:** Charts, metrics, period selection

**Quick Actions**
**Path:** `/components/dashboard/quick-actions.tsx`  
**Purpose:** Quick action buttons panel  
**Props:** `actions`, `layout`  
**Features:** Common tasks, shortcuts, new content creation

#### Research Components (`/components/research/`)

**Keyword Research**
**Path:** `/components/research/keyword-research.tsx`  
**Purpose:** Keyword research interface  
**Props:** `onSearch`, `results`, `loading`  
**Features:** Search input, results table, export options

**Research Results**
**Path:** `/components/research/research-results.tsx`  
**Purpose:** Research results display  
**Props:** `results`, `onSelect`, `onExport`  
**Features:** Sortable table, filters, bulk selection

#### Settings Components (`/components/settings/`)

**Organization Settings**
**Path:** `/components/settings/organization-settings.tsx`  
**Purpose:** Organization configuration  
**Props:** `organization`, `onUpdate`  
**Features:** Plan management, billing info, team settings

**User Settings**
**Path:** `/components/settings/user-settings.tsx`  
**Purpose:** User profile configuration  
**Props:** `user`, `onUpdate`  
**Features:** Profile information, preferences, security

#### Guard Components (`/components/guards/`)

**Auth Guard**
**Path:** `/components/guards/auth-guard.tsx`  
**Purpose:** Authentication protection wrapper  
**Props:** `children`, `redirectTo`  
**Features:** Redirect logic, loading states

**Role Guard**
**Path:** `/components/guards/role-guard.tsx`  
**Purpose:** Role-based access control  
**Props:** `children`, `requiredRole`, `fallback`  
**Features:** Permission checking, access denied UI

**Suspension Guard**
**Path:** `/components/guards/suspension-guard.tsx`  
**Purpose:** Account suspension protection  
**Props:** `children`, `user`  
**Features:** Suspension status check, payment prompts

### Marketing Components (`/components/marketing`)

**NEW: UX Landing Page Components (January 2026)**

#### Navigation
**Path:** `/components/marketing/Navigation.tsx`  
**Purpose:** Main navigation with dropdown menus  
**Props:** None (static content)  
**Features:** Mobile menu toggle, dropdown navigation, logo with fallback
**Design:** Responsive layout, hover effects, accessibility focus states

#### Hero Section
**Path:** `/components/marketing/HeroSection.tsx`  
**Purpose:** Main hero section with 60/40 layout  
**Props:** None (static content)  
**Features:** Gradient mesh background, dashboard preview, dual CTAs
**Design:** Responsive typography, trust indicators, hover animations

#### Stats Bar
**Path:** `/components/marketing/StatsBar.tsx`  
**Purpose:** Social proof statistics display  
**Props:** None (static data)  
**Features:** 4 stat cards with icons, animated hover effects
**Design:** 2x2 grid mobile, 4-column desktop, responsive typography

#### Problem Section
**Path:** `/components/marketing/ProblemSection.tsx`  
**Purpose:** Pain points presentation  
**Props:** None (static content)  
**Features:** 3-column cards, hover lift effects, pain point icons
**Design:** Card layout, red accent colors, smooth transitions

#### Feature Showcase
**Path:** `/components/marketing/FeatureShowcase.tsx`  
**Purpose:** Feature highlights display  
**Props:** None (static content)  
**Features:** 6 feature cards, gradient borders, benefit badges
**Design:** 3x2 grid, hover states, gradient text effects

#### How It Works
**Path:** `/components/marketing/HowItWorks.tsx`  
**Purpose:** Process explanation  
**Props:** None (static content)  
**Features:** 3-step horizontal flow, connecting lines, step badges
**Design:** Desktop horizontal, mobile vertical, smooth animations

#### Testimonials
**Path:** `/components/marketing/Testimonials.tsx`  
**Purpose:** Customer testimonials  
**Props:** None (static content)  
**Features:** Quote marks, avatar circles, metric badges, star ratings
**Design:** Card layout, hover effects, author information

#### FAQ
**Path:** `/components/marketing/FAQ.tsx`  
**Purpose:** Frequently asked questions  
**Props:** None (static content)  
**Features:** Accordion style, smooth expand/collapse, rotating chevrons
**Design:** Interactive elements, focus management, accessibility

#### Final CTA
**Path:** `/components/marketing/FinalCTA.tsx`  
**Purpose:** Final call-to-action section  
**Props:** None (static content)  
**Features:** Gradient background, animated elements, trust badges
**Design:** Vibrant gradient, pulse animations, large CTA button

#### Footer
**Path:** `/components/marketing/Footer.tsx`  
**Purpose:** Site footer with links  
**Props:** None (static content)  
**Features:** 4-column layout, social links, legal links
**Design:** Responsive columns, social icon animations, hover effects

#### Landing Page
**Path:** `/components/marketing/LandingPage.tsx`  
**Purpose:** Main landing page wrapper  
**Props:** None  
**Features:** Imports and renders all marketing sections
**Design:** Sequential component rendering, consistent spacing

### App Components (`/app/components`)

#### Payment Status Banner
**Path:** `/app/components/payment-status-banner.tsx`  
**Purpose:** Payment status notification banner  
**Props:** `status`, `gracePeriodEnds`, `onUpdatePayment`  
**Features:** Urgent payment alerts, grace period warnings

#### Suspension Message
**Path:** `/app/components/suspension-message.tsx`  
**Purpose:** Account suspension notification  
**Props:** `reason`, `canReactivate`, `onReactivate`  
**Features:** Suspension details, reactivation options

## Design System

### UX Design System (January 2026 Update)

#### Typography System
- **Headings:** Poppins Bold (700 weight)
- **Body:** Lato Regular (400 weight)
- **Responsive:** clamp() functions for fluid scaling
- **Implementation:** Google Fonts integration

#### Color Palette
- **Brand Electric Blue:** `#217CEB`
- **Brand Infinite Purple:** `#4A42CC`
- **Brand Deep Charcoal:** `#2C2C2E`
- **Brand Soft Light Gray:** `#F4F4F6`
- **Brand White:** `#FFFFFF`
- **Spectrums:** Blue (50-900), Purple (50-900), Neutral (50-900)

#### Gradient System
- **Brand Gradient:** `linear-gradient(to right, #217CEB, #4A42CC)`
- **Vibrant Gradient:** `linear-gradient(135deg, #217CEB 0%, #4A42CC 50%, #332D85 100%)`
- **Mesh Gradient:** `radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 0.12) 0px, transparent 50%)`

#### Shadow System
- **Brand Shadow:** `0 10px 25px rgba(33, 124, 235, 0.15)`
- **Purple Shadow:** `0 10px 25px rgba(74, 66, 204, 0.15)`
- **Scale:** sm, md, lg, xl with consistent blur and spread

#### Spacing System
- **Scale:** xs (8px), sm (12px), md (16px), lg (24px), xl (32px), 2xl (48px), 3xl (64px), 4xl (80px)
- **Section Padding:** 5rem 0 (desktop), 3rem 0 (mobile)
- **Usage:** CSS variables with semantic naming

### Legacy Design System

#### Color Palette (Legacy)
- **Primary:** Blue-600 (`#2563eb`)
- **Secondary:** Gray-600 (`#4b5563`)
- **Success:** Green-600 (`#059669`)
- **Warning:** Yellow-600 (`#d97706`)
- **Error:** Red-600 (`#dc2626`)
- **Neutral:** Gray-50 to Gray-900 scale

#### Typography Scale (Legacy)
- **Headings:** Inter font, weights 600-700
- **Body:** Inter font, weight 400
- **Small:** Inter font, weight 400, size 14px
- **Caption:** Inter font, weight 400, size 12px

### Component Patterns

#### Compound Components
- Dialog with DialogHeader, DialogContent, DialogFooter
- Dropdown Menu with MenuTrigger, MenuContent, MenuItem
- Form with FormField, FormControl, FormLabel

#### Render Props Pattern
- Article Generator with custom progress rendering
- Research Results with custom result formatting

#### Higher-Order Components
- Auth Guard wrapping protected routes
- Role Guard restricting access by permissions
- Suspension Guard checking account status

## State Management

### Local State
- React useState for component-specific state
- Form state with controlled components
- UI state (loading, error, success) per component

### Global State
- User authentication state via Supabase auth
- Organization context for multi-tenant data
- Theme preferences via localStorage

### Server State
- React Query for API data caching
- Real-time updates via Supabase subscriptions
- Optimistic updates for better UX

## Accessibility Features

### Keyboard Navigation
- Tab order follows logical flow
- Focus indicators on all interactive elements
- Skip links for main content areas

### Screen Reader Support
- Semantic HTML elements
- ARIA labels and descriptions
- Live regions for dynamic content

### Visual Accessibility
- High contrast color combinations
- Resizable text up to 200%
- Focus visible indicators

## Performance Optimizations

### Code Splitting
- Route-based component splitting
- Dynamic imports for heavy components
- Lazy loading for non-critical UI

### Bundle Optimization
- Tree shaking for unused components
- Component size monitoring
- External library optimization

### Runtime Performance
- React.memo for expensive renders
- useMemo for expensive calculations
- useCallback for stable references

## Testing Strategy

### Unit Tests
- Component rendering tests
- Props validation tests
- User interaction tests
- Accessibility tests

### Integration Tests
- Component composition tests
- State management tests
- API integration tests

### E2E Tests
- User workflow tests
- Critical path tests
- Cross-browser compatibility

## Component Guidelines

### Naming Conventions
- PascalCase for component names
- Descriptive, purpose-driven names
- Consistent prefix for related components

### File Structure
- One component per file
- Co-located test files
- Index files for barrel exports

### Props Design
- Clear, descriptive prop names
- Proper TypeScript types
- Default values where appropriate
- JSDoc comments for complex props

### Styling Approach
- Tailwind CSS for utility-first styling
- Component variants for different states
- Consistent spacing and typography
- Responsive design principles

---

*This documentation was generated as part of the BMad Method document-project workflow on 2026-01-11.*

**Major Update**: January 19, 2026 - Added 9 new UX landing page components with complete design system overhaul. See [UX Landing Page Design System](./ux-landing-page-design-system.md) for detailed implementation documentation.
