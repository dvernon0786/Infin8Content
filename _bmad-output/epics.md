---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - '_bmad-output/prd.md'
  - '_bmad-output/architecture.md'
  - '_bmad-output/ux-design-specification.md'
epicStructure: '14-epic-structure-with-seo'
totalEpics: 14
phase1Epics: 7
phase2Epics: 4
phase3Epics: 3
prioritizedEpic: 'Epic 14 - SEO Optimization Framework (MVP BLOCKER)'
date: '2026-01-10'
status: 'seo-epic-added'
---
  - '_bmad-output/prd.md'
  - '_bmad-output/architecture.md'
  - '_bmad-output/ux-design-specification.md'
---

# Infin8Content - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Infin8Content, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Users can create accounts and authenticate (email/password, OAuth)
FR2: Organization owners can create organizations and manage organization settings
FR3: Organization owners can invite team members with role assignments (Owner, Editor, Viewer)
FR4: System enforces role-based access control (users can only access features permitted by their role)
FR5: System enforces plan-based feature gating (users can only access features included in their subscription tier)
FR6: Organization owners can manage billing and subscription (upgrade, downgrade, cancel)
FR7: Users can view and export their personal data (GDPR/CCPA compliance)
FR8: Users can delete their accounts (with data retention period)
FR9: System tracks usage per organization (articles generated, API calls, storage used)
FR10: System can enforce row-level security policies (multi-tenant data isolation)
FR11: System can prevent cross-organization data access (data isolation enforcement)
FR12: System can audit data access for compliance (access logging and monitoring)
FR13: Users can research keywords with search volume, difficulty, and trend data
FR14: Users can filter and organize keyword research results (by volume, difficulty, intent)
FR15: System can generate keyword clusters (pillar content + supporting articles)
FR16: System can perform real-time web research with citations (Tavily integration)
FR17: System can analyze SERP data for target keywords (competitor analysis, ranking factors)
FR18: Users can view keyword research history and saved keyword lists
FR19: System can suggest related keywords based on seed keyword
FR20: Users can perform batch keyword research (multiple keywords in one operation)
FR21: Users can generate long-form articles (3,000+ words) from keywords
FR22: System generates articles using section-by-section architecture (fresh research per section)
FR23: System automatically includes citations in generated content (EEAT compliance)
FR24: System automatically optimizes content for SEO (keyword density, heading structure, meta tags)
FR25: System automatically generates FAQ sections for articles
FR26: System automatically suggests and inserts internal links during content generation
FR27: System automatically generates schema markup (Article, FAQ, HowTo, Product, Review)
FR28: System automatically finds and integrates relevant images with alt text
FR29: Users can edit generated content (add, remove, modify sections)
FR30: Users can edit individual sections of articles independently
FR31: Users can request regeneration of specific sections or parts of articles
FR32: Users can save article structures as templates for reuse
FR33: Users can create custom writing styles and tones for content generation
FR34: Users can duplicate articles as templates for similar content
FR35: System tracks content generation progress in real-time (progress updates)
FR36: Users can save articles as drafts before publishing
FR37: System maintains version history for articles (revision tracking)
FR38: System can store article drafts and revisions (data persistence)
FR39: Users can restore previous versions of articles
FR40: System can track content changes over time (change history)
FR41: Users can organize articles into folders or collections
FR42: Users can search and filter their content library
FR43: Users can select multiple articles for bulk operations
FR44: Users can perform bulk editing on multiple articles
FR45: Users can publish articles to WordPress (one-click publish, draft or live)
FR46: System automatically submits published URLs to Google Search Console for indexing
FR47: System tracks indexing status for submitted URLs (indexed, pending, failed)
FR48: Users can generate social media posts from articles (Twitter, LinkedIn, Facebook formats)
FR49: Users can view publishing history and status for all articles
FR50: System can publish articles in bulk (multiple articles to multiple destinations)
FR51: Users can configure publishing settings per CMS connection (default status, categories, tags)
FR52: System can export articles in multiple formats (HTML, Markdown, PDF, DOCX)
FR53: System can schedule article publishing for future dates
FR54: System can handle timezone conversions for scheduled publishing
FR55: System can validate CMS connection credentials before publishing
FR56: System can refresh expired OAuth tokens automatically
FR57: Users can connect e-commerce stores (Shopify, WooCommerce)
FR58: System can sync product catalogs from connected stores (products, prices, images, inventory)
FR59: System can generate product descriptions from product data
FR60: System can automatically link to relevant products in blog content
FR61: System can generate UTM parameters for content links (tracking attribution)
FR62: System can match e-commerce orders to content via UTM tracking
FR63: Users can view revenue attribution reports (which articles drove sales, revenue per article)
FR64: Users can export revenue attribution data for stakeholder reporting
FR65: System can manage multiple e-commerce stores per organization
FR66: Organization owners (Agency plan) can configure white-label branding (logo, colors, fonts)
FR67: Organization owners (Agency plan) can set up custom domains for white-label portals
FR68: Organization owners (Agency plan) can invite client stakeholders to white-label portals
FR69: Client stakeholders can access white-label portals with read-only access to their content
FR70: System isolates data per organization (multi-tenant data isolation)
FR71: Organization owners can manage multiple projects (content collections)
FR72: Organization owners can assign projects to specific team members or clients
FR73: Users can view dashboard with success metrics (time saved, content output, ROI)
FR74: Users can track article performance (views, rankings, conversions)
FR75: Users can view keyword ranking data (position tracking over time)
FR76: Users can view content quality metrics (readability, SEO score, citation count)
FR77: Users can view feature adoption metrics (which modules are used most)
FR78: System can generate shareable attribution reports for stakeholders
FR79: Users can view analytics per project, per article, or aggregated
FR80: System can track time saved per user (success metric: 10+ hours/week target)
FR81: System can measure content output increase (success metric: 3× target)
FR82: System can calculate ROI per organization
FR83: System can generate case study data (usage stats, ROI proof)
FR84: System can identify which modules drive retention
FR85: System can surface unused features to users
FR86: System can recommend feature usage based on persona
FR87: System tracks usage credits per organization (articles, keyword researches, API calls)
FR88: Users can view real-time usage dashboard (credits used vs. plan limits)
FR89: System alerts users when approaching usage limits (90% threshold)
FR90: System calculates and charges overage fees for usage beyond plan limits
FR91: System manages subscription billing (Stripe integration, invoices, payment processing)
FR92: Users can upgrade or downgrade subscription plans (with prorated billing)
FR93: System tracks API costs per organization (monitoring and cost control)
FR94: Users can view billing history and download invoices
FR95: System can enforce usage limits per plan tier
FR96: System can alert when approaching cost thresholds
FR97: System can identify users approaching plan limits
FR98: System can suggest upgrades based on usage patterns
FR99: System can show value of upgrading (feature comparison)
FR100: Users can generate API keys for programmatic access
FR101: System provides REST API endpoints for core operations (content generation, publishing, research)
FR102: System enforces rate limiting per API key
FR103: System can receive webhook notifications from external systems
FR104: Users can configure webhook endpoints for custom integrations
FR105: Users can view and understand why operations failed
FR106: Users can retry failed operations with one click
FR107: Users receive clear error messages with actionable next steps
FR108: System can queue article generation requests (async processing)
FR109: System can retry failed operations with exponential backoff
FR110: System can handle concurrent requests without blocking
FR111: System can handle integration failures gracefully
FR112: Team members can comment on articles before publishing
FR113: Organization owners can approve articles before publishing
FR114: Users can assign articles to team members
FR115: System can manage article ownership and permissions
FR116: System can track article status (draft, in-review, approved, published)
FR117: System can notify users of article status changes
FR118: New users can discover features through guided tours or tutorials (after payment confirmation)
FR119: System can provide feature discovery mechanisms for new users (after payment confirmation)
FR120: Users can access help documentation and support resources (available before payment for information, full access after payment)
FR121: Users can generate news articles from latest events (Phase 2)
FR122: Users can generate listicle articles with comparison tables (Phase 2)
FR123: Users can convert YouTube videos to blog posts (Phase 2)
FR124: Users can set up automated blog content generation (Phase 2)
FR125: Users can generate competitor comparison pages (Phase 2)
FR126: Users can edit existing articles with AI assistance (Phase 2)
FR127: Users can connect additional CMS platforms beyond WordPress (Shopify, Webflow, Ghost, Wix, Squarespace, Blogger) (Phase 2)
FR128: Users can integrate with Zapier for no-code automation workflows (Phase 2)
FR129: System can sync live product pricing and inventory from e-commerce stores (Phase 2)
FR130: Users must complete payment before accessing the dashboard
FR131: System blocks dashboard access for unpaid accounts
FR132: System suspends accounts after payment failure (7-day grace period)
FR133: System reactivates accounts upon successful payment
FR134: System sends payment failure notifications to users during grace period
FR135: System provides pre-payment information pages (pricing, features, case studies) without requiring account creation
FR136: System requires account creation and payment before dashboard access
FR137: System displays payment status and account activation status to users
FR138: Users can access a main dashboard after payment confirmation
FR139: Dashboard displays persona-specific default view (Agency: multi-client overview, E-commerce: revenue attribution, SaaS: ranking performance)
FR140: Dashboard shows real-time usage credits (articles remaining, keyword researches remaining, API calls remaining)
FR141: Dashboard displays key success metrics prominently (time saved, content output, ROI)
FR142: Dashboard shows recent activity feed (articles generated, published, indexed)
FR143: Dashboard provides quick action buttons (Generate Article, Research Keywords, View Reports)
FR144: Dashboard displays revenue attribution summary (total revenue attributed, top-performing articles)
FR145: Dashboard shows article generation queue status (in-progress, completed, failed)
FR146: Dashboard provides navigation to all major features (Research, Writing, Publishing, Analytics, Settings)
FR147: Dashboard supports customizable widget layout (users can rearrange dashboard sections)
FR148: Dashboard displays notifications for important events (payment failures, usage limits, article completions)
FR149: Dashboard shows multi-client switcher for agency users (one-click client switching)
FR150: Dashboard displays white-label branding for agency client portals (custom logo, colors, fonts)
FR151: Dashboard provides filtering and sorting for content lists (by date, status, performance, client)
FR152: Dashboard shows progress indicators for long-running operations (article generation, bulk publishing)
FR153: Dashboard displays empty states with helpful guidance (no articles yet, no clients yet, etc.)
FR154: Dashboard provides search functionality across all content (articles, keywords, clients, projects)
FR155: Dashboard shows time-based analytics (daily, weekly, monthly, custom date ranges)
FR156: Dashboard displays comparison views (this month vs. last month, this client vs. all clients)
FR157: Dashboard provides export functionality for dashboard data (CSV, PDF, shareable links)
FR158: Dashboard supports responsive design (mobile, tablet, desktop views)
FR159: Dashboard displays loading states gracefully (skeleton screens, progress indicators)
FR160: Dashboard shows error states with clear recovery actions (retry buttons, error messages)

### NonFunctional Requirements

NFR-P1: Article Generation Speed - System must generate 3,000-word articles in < 5 minutes (99th percentile)
NFR-P2: Dashboard Load Time - Dashboard must load in < 2 seconds (95th percentile)
NFR-P3: Real-Time Progress Updates - Progress updates must appear within 1 second of state change
NFR-P4: Queue Processing Time - Article generation requests must enter processing queue within 30 seconds
NFR-P5: API Response Times - All API endpoints must respond in < 2 seconds (95th percentile)
NFR-P6: Concurrent Processing - System must handle 50+ concurrent article generations without performance degradation
NFR-S1: Data Encryption - All data must be encrypted at rest (AES-256) and in transit (TLS 1.3)
NFR-S2: Multi-Tenant Data Isolation - System must enforce row-level security (RLS) preventing cross-organization data access
NFR-S3: Authentication Security - All authentication must use secure protocols (OAuth 2.0, JWT with expiration)
NFR-S4: API Key Security - API keys must be hashed (bcrypt) and never exposed in client-side code
NFR-S5: Payment Security - Payment processing must comply with PCI DSS (handled by Stripe)
NFR-S6: Credential Storage - CMS connection credentials must be encrypted at rest (AES-256) and decrypted only in worker memory
NFR-S7: Access Control - System must enforce role-based access control (RBAC) and plan-based feature gating
NFR-S8: Audit Logging - System must log all sensitive operations (billing changes, team invites, data exports)
NFR-R1: Uptime SLA - System must maintain 99.9% uptime (Agency plan), 99.5% (Pro plan), 99% (Starter plan)
NFR-R2: API Failure Rate - Combined API failure rate (Tavily + DataForSEO + OpenRouter) must be < 1%
NFR-R3: Error Recovery - System must automatically retry failed operations with exponential backoff (3 attempts)
NFR-R4: Data Backup & Recovery - System must perform daily backups with 30-day retention
NFR-R5: Graceful Degradation - System must continue operating with reduced functionality if non-critical services fail
NFR-SC1: User Capacity - System must support 1,000 paying customers by Month 12 without performance degradation
NFR-SC2: Article Generation Capacity - System must handle 10,000+ article generations/month without queue buildup
NFR-SC3: Database Scalability - Database must support 100,000+ articles without query performance degradation
NFR-SC4: Storage Scalability - System must support 1TB+ of image storage without performance impact
NFR-SC5: Auto-Scaling - System must automatically scale infrastructure based on demand
NFR-I1: CMS Integration Reliability - CMS integrations must maintain 99%+ success rate for publishing operations
NFR-I2: External API Integration - External API integrations (Tavily, DataForSEO, OpenRouter) must handle rate limits gracefully
NFR-I3: OAuth Token Management - System must automatically refresh expired OAuth tokens before expiration
NFR-I4: Webhook Reliability - Webhook endpoints must process 99%+ of incoming requests successfully
NFR-I5: Integration Health Monitoring - System must monitor integration health and alert on failures
NFR-A1: WCAG Compliance - System must comply with WCAG 2.1 Level AA standards
NFR-A2: Keyboard Navigation - All functionality must be accessible via keyboard navigation
NFR-A3: Screen Reader Support - System must be compatible with screen readers (NVDA, JAWS, VoiceOver)
NFR-A4: Color Contrast - All text must meet WCAG contrast ratio requirements (4.5:1 for normal text, 3:1 for large text)
NFR-DQ1: Content Quality Standards - 70%+ of generated articles must score > 60 on Flesch-Kincaid readability
NFR-DQ2: Citation Requirements - 80%+ of articles must include 3+ citations (EEAT compliance)
NFR-DQ3: Plagiarism Prevention - 90%+ of articles must pass plagiarism check (> 95% original content)
NFR-DQ4: User Quality Ratings - Average user rating for article quality must be 4.0+ (1-5 scale)
NFR-CE1: API Cost Control - API costs (Tavily + DataForSEO + LLM) must be < $0.80/article
NFR-CE2: Total COGS - Total cost of goods sold (COGS) must be < $1.50/article
NFR-CE3: Support Cost Ratio - Support costs must be < 15% of revenue
NFR-CE4: Cost Monitoring - System must alert when API costs exceed 20% of revenue per organization
NFR-COM1: GDPR Compliance - System must comply with GDPR requirements (data export, deletion, portability)
NFR-COM2: CCPA Compliance - System must comply with CCPA requirements (similar to GDPR)
NFR-COM3: Data Residency - System must support data residency requirements (US default, EU optional)
NFR-COM4: Privacy Policy & Terms - System must provide accessible privacy policy and terms of service

### Additional Requirements

**From Architecture Document:**

- Starter Template: Use `create-next-app@latest infin8content --typescript --tailwind --app --no-src-dir --import-alias "@/*"` for project initialization (Epic 1 Story 1)
- Infrastructure: Vercel for frontend deployment, Supabase for database and auth, Inngest for queue workers
- Database: Supabase Postgres with row-level security (RLS) for multi-tenant isolation
- Queue System: Inngest for async processing of article generation, publishing, and other long-running operations
- Real-time: Supabase websockets for progress updates, notifications, and live dashboard data
- Storage: Cloudflare R2 or Supabase Storage for image assets and file uploads
- CDN: Vercel Edge Network for static assets and global distribution
- Technology Stack: Next.js App Router (frontend), Serverless APIs (Next.js API routes), Supabase Postgres with row-level security, Inngest workers (queue processing), Vercel Edge Network (CDN), Supabase websockets (real-time), Cloudflare R2 or Supabase Storage (images)
- Design System: Tailwind CSS + shadcn/ui for UI components
- Project Structure: Follow architecture document's defined structure (200+ files/directories)
- Integration Patterns: Platform-specific adapters (WordPressAdapter, ShopifyAdapter, etc.) with unified publishing interface
- Error Handling: 3 retry attempts with exponential backoff for external API calls
- Rate Limit Management: Respect API limits, implement queuing for rate-limited requests
- Cost Tracking: Monitor API costs per user, alert if >20% of revenue
- OAuth Token Refresh: Automatic refresh for OAuth integrations (1 hour before expiration)
- Webhook Verification: HMAC signature verification for security
- Credential Storage: Encrypted at rest (AES-256), decrypted only in worker memory
- Monitoring: Integration health dashboard and alert response time (< 5 minutes)
- Data Model: Every table has `org_id` foreign key for multi-tenant isolation
- White-Label Configuration: Stored per organization in `organizations.white_label_settings` JSONB column
- Custom Domain Setup: CNAME configuration and SSL auto-provisioning
- Client Portal: Subdomain per client (client1.agency.com, client2.agency.com)
- Runtime Themeable Components: Data-driven branding from database

**From UX Design Document:**

- Design Direction: Professional & Efficient (Dense) - 4-column grid, 240px sidebar, 12px base spacing, 14px base font size
- Responsive Design: Mobile (<640px), Tablet (640-1024px), Desktop (>1024px) breakpoints
- Accessibility: WCAG 2.1 Level AA compliance, 100% keyboard navigation support, screen reader compatibility (NVDA, JAWS, VoiceOver), WCAG contrast ratio requirements (4.5:1 normal text, 3:1 large text)
- Component Library: 10 custom components specified (Article Editor, Progress Visualization, Command Palette, Revenue Attribution Charts, Queue Status, Client Switcher, Dashboard Widgets, Article List Views, Keyword Research Interface, White-Label Theme Preview)
- User Journey Flows: 5 critical journeys with detailed Mermaid flowcharts (First Article Creation, Agency Multi-Client Workflow, Revenue Attribution Discovery, Onboarding Journey, Bulk Operations Journey)
- Payment & Access Control UX: Paywall-first model, payment flow design, account suspension states, grace period messaging
- Onboarding Flow: 5-step guided flow (Welcome, Persona Selection, CMS Connection, First Article, Dashboard Tour)
- UX Patterns: Button Hierarchy, Feedback Patterns, Form Patterns, Navigation Patterns, Modal/Overlay Patterns, Empty States, Loading States, Search/Filtering, Error Recovery
- Color System: Primary palette, semantic colors (success, warning, error, info), neutral grays
- Typography: Inter font family, size scale (xs: 12px to 4xl: 36px), weight scale (regular: 400 to bold: 700)
- Spacing System: 4px base unit, scale 4-128px
- Animation & Transitions: Fast (150ms), Normal (200ms), Slow (300ms) durations with ease-in-out easing
- Dashboard Layout: Left Sidebar Navigation (240px), Center Workspace, Right Contextual Panel (collapsible), Top Bar
- Widget Customization: Drag & drop reordering, add/remove widgets, resize (optional)
- Real-Time Updates: Websocket infrastructure for live progress tracking, graceful degradation when connection drops
- Section-by-Section Progress: Granular progress indicators ("Writing section 3 of 8... 45%")
- Multi-Client Management: Client switcher in top bar (one-click switching), client-specific views
- Revenue Attribution Visualization: Prominent display in article lists, dashboard summary, time-based charts, shareable reports
- Search Functionality: Global search (Cmd/Ctrl + K), grouped results, keyboard navigation
- Keyboard Shortcuts: Global shortcuts (Cmd/Ctrl + K for search, Cmd/Ctrl + / for help), navigation shortcuts, editor shortcuts
- Notification System: Toast notifications (top-right desktop, bottom mobile), notification center with bell icon
- Loading States: Skeleton screens, progress indicators, spinner overlays
- Error States: Clear messaging, recovery actions, partial failure handling

### FR Coverage Map

**Epic 1: Foundation & Access Control**
- FR1: User authentication (email/password, OAuth)
- FR2: Organization creation and management
- FR3: Team member invites and role assignments
- FR10: Row-level security policies enforcement
- FR11: Cross-organization data access prevention
- FR12: Audit logging for compliance
- FR130: Payment required before dashboard access
- FR131: Dashboard access blocking for unpaid accounts
- FR132: Account suspension after payment failure (7-day grace)
- FR133: Account reactivation upon successful payment
- FR134: Payment failure notifications during grace period
- FR135: Pre-payment information pages
- FR136: Account creation and payment before dashboard access
- FR137: Payment status and account activation display
- FR138: Main dashboard access after payment confirmation

**Epic 2: Dashboard Foundation & User Experience**
- FR138: Main dashboard access (also in Epic 1 for initial access)
- FR139: Persona-specific default dashboard view
- FR140: Real-time usage credits display
- FR141: Key success metrics display
- FR142: Recent activity feed
- FR143: Quick action buttons
- FR144: Revenue attribution summary
- FR145: Article generation queue status
- FR146: Navigation to all major features
- FR147: Customizable widget layout
- FR148: Notifications for important events
- FR149: Multi-client switcher for agency users
- FR150: White-label branding display for client portals
- FR151: Filtering and sorting for content lists
- FR152: Progress indicators for long-running operations
- FR153: Empty states with helpful guidance
- FR154: Search functionality across all content
- FR155: Time-based analytics display
- FR156: Comparison views (this month vs. last month)
- FR157: Export functionality for dashboard data
- FR158: Responsive design support
- FR159: Loading states gracefully displayed
- FR160: Error states with clear recovery actions

**Epic 3: Content Research & Discovery**
- FR13: Keyword research with search volume, difficulty, trend data
- FR14: Filter and organize keyword research results
- FR15: Generate keyword clusters (pillar content + supporting articles)
- FR16: Real-time web research with citations (Tavily integration)
- FR17: Analyze SERP data for target keywords
- FR18: View keyword research history and saved keyword lists
- FR19: Suggest related keywords based on seed keyword
- FR20: Batch keyword research operations

**Epic 4A: Article Generation Core**
- FR21: Generate long-form articles (3,000+ words) from keywords
- FR22: Section-by-section architecture (fresh research per section)
- FR23: Automatic citation inclusion (EEAT compliance)
- FR24: Automatic SEO optimization (keyword density, headings, meta tags)
- FR25: Automatic FAQ section generation
- FR26: Automatic internal linking suggestions
- FR27: Automatic schema markup generation
- FR28: Automatic image integration with alt text
- FR35: Real-time content generation progress tracking

**Epic 4B: Content Editing & Management**
- FR29: Edit generated content (add, remove, modify sections)
- FR30: Edit individual sections independently
- FR31: Request regeneration of specific sections
- FR32: Save article structures as templates
- FR33: Create custom writing styles and tones
- FR34: Duplicate articles as templates
- FR36: Save articles as drafts
- FR37: Version history maintenance
- FR38: Store article drafts and revisions
- FR39: Restore previous versions
- FR40: Track content changes over time
- FR41: Organize articles into folders/collections
- FR42: Search and filter content library
- FR43: Select multiple articles for bulk operations
- FR44: Perform bulk editing on multiple articles

**Epic 5: Publishing & Distribution**
- FR45: Publish articles to WordPress (one-click publish)
- FR46: Automatic Google Search Console indexing
- FR47: Track indexing status for submitted URLs
- FR48: Generate social media posts from articles
- FR49: View publishing history and status
- FR50: Bulk publishing (multiple articles to multiple destinations)
- FR51: Configure publishing settings per CMS connection
- FR52: Export articles in multiple formats
- FR53: Schedule article publishing for future dates
- FR54: Handle timezone conversions for scheduled publishing
- FR55: Validate CMS connection credentials before publishing
- FR56: Refresh expired OAuth tokens automatically

**Epic 6: Analytics & Performance Tracking**
- FR73: View dashboard with success metrics
- FR74: Track article performance (views, rankings, conversions)
- FR75: View keyword ranking data (position tracking over time)
- FR76: View content quality metrics (readability, SEO score, citation count)
- FR77: View feature adoption metrics
- FR78: Generate shareable attribution reports
- FR79: View analytics per project, per article, or aggregated
- FR80: Track time saved per user (10+ hours/week target)
- FR81: Measure content output increase (3× target)
- FR82: Calculate ROI per organization
- FR83: Generate case study data
- FR84: Identify modules that drive retention
- FR85: Surface unused features to users
- FR86: Recommend feature usage based on persona

**Epic 7: E-Commerce Integration & Revenue Attribution**
- FR57: Connect e-commerce stores (Shopify, WooCommerce)
- FR58: Sync product catalogs from connected stores
- FR59: Generate product descriptions from product data
- FR60: Automatically link to relevant products in blog content
- FR61: Generate UTM parameters for content links
- FR62: Match e-commerce orders to content via UTM tracking
- FR63: View revenue attribution reports
- FR64: Export revenue attribution data for stakeholder reporting
- FR65: Manage multiple e-commerce stores per organization

**Epic 8: White-Label & Multi-Client Management**
- FR66: Configure white-label branding (logo, colors, fonts) - Agency plan only
- FR67: Set up custom domains for white-label portals
- FR68: Invite client stakeholders to white-label portals
- FR69: Client portal access with read-only permissions
- FR70: Multi-tenant data isolation (reinforcement)
- FR71: Manage multiple projects (content collections)
- FR72: Assign projects to specific team members or clients

**Epic 9: Team Collaboration & Workflow**
- FR112: Team members can comment on articles before publishing
- FR113: Organization owners can approve articles before publishing
- FR114: Assign articles to team members
- FR115: Manage article ownership and permissions
- FR116: Track article status (draft, in-review, approved, published)
- FR117: Notify users of article status changes

**Epic 10: Billing & Usage Management**
- FR6: Manage billing and subscription (upgrade, downgrade, cancel)
- FR87: Track usage credits per organization
- FR88: View real-time usage dashboard
- FR89: Alert users when approaching usage limits (90% threshold)
- FR90: Calculate and charge overage fees
- FR91: Manage subscription billing (Stripe integration)
- FR92: Upgrade or downgrade subscription plans (with prorated billing)
- FR93: Track API costs per organization
- FR94: View billing history and download invoices
- FR95: Enforce usage limits per plan tier
- FR96: Alert when approaching cost thresholds
- FR97: Identify users approaching plan limits
- FR98: Suggest upgrades based on usage patterns
- FR99: Show value of upgrading (feature comparison)

**Epic 11: API & Webhook Integrations**
- FR100: Generate API keys for programmatic access
- FR101: REST API endpoints for core operations
- FR102: Enforce rate limiting per API key
- FR103: Receive webhook notifications from external systems
- FR104: Configure webhook endpoints for custom integrations

**Epic 12: Onboarding & Feature Discovery**
- FR118: Post-payment guided tours and tutorials
- FR119: Feature discovery mechanisms for new users
- FR120: Help documentation and support resources
- FR135: Pre-payment information pages (also in Epic 1)
- FR136: Account creation and payment before dashboard access (also in Epic 1)
- FR137: Payment status and account activation display (also in Epic 1)

**Epic 13: Phase 2 Advanced Features (Post-Launch)**
- FR121: Generate news articles from latest events
- FR122: Generate listicle articles with comparison tables
- FR123: Convert YouTube videos to blog posts
- FR124: Set up automated blog content generation
- FR125: Generate competitor comparison pages
- FR126: Edit existing articles with AI assistance
- FR127: Connect additional CMS platforms (Shopify, Webflow, Ghost, Wix, Squarespace, Blogger)
- FR128: Integrate with Zapier for no-code automation workflows
- FR129: Sync live product pricing and inventory from e-commerce stores

**Cross-Cutting Requirements (Embedded Throughout):**
- FR4: RBAC enforcement (embedded in Epic 1, Epic 8, Epic 9)
- FR5: Plan-based feature gating (embedded in all epics with feature access)
- FR7: GDPR/CCPA data export (embedded in Epic 1, Epic 10)
- FR8: Account deletion (embedded in Epic 1)
- FR9: Usage tracking (embedded in Epic 1, Epic 10, all content generation epics)
- FR105-FR111: Error handling and recovery (embedded in Epic 3, Epic 4A, Epic 5, Epic 7)

**Coverage Summary:**
- Total FRs: 160
- Mapped to specific epics: 151 FRs
- Cross-cutting FRs: 9 FRs (embedded throughout)
- Phase 1 FRs: 151 (Epic 1-6, Epic 7, Epic 8, Epic 9, Epic 10, Epic 11, Epic 12)
- Phase 2 FRs: 9 (Epic 13)

## Epic List

### Epic 1: Foundation & Access Control
**User Outcome:** Users can sign up, complete payment, and securely access the platform with proper authentication, authorization, and team management.

**FRs covered:** FR1, FR2, FR3, FR10-FR12, FR130-FR137, FR138

**Key Capabilities:**
- User authentication (email/password, OAuth)
- Organization creation and management
- Team member invites and role assignments (Owner, Editor, Viewer)
- Role-based access control (RBAC) enforcement
- Plan-based feature gating
- Payment-first access model (paywall)
- Row-level security (RLS) for multi-tenant isolation
- Audit logging for compliance
- Basic dashboard access after payment

**Dependencies:** None (foundation epic)

**Success Metrics:**
- 100% of users complete payment before dashboard access
- Zero cross-organization data leakage
- < 2 seconds dashboard load time (NFR-P2)

### Story 1.1: Project Initialization and Starter Template Setup

**Priority:** P0 (MVP - Foundation)

As a developer,
I want to initialize the Next.js project with TypeScript and Tailwind CSS,
So that I have a clean foundation following the architecture specifications.

**Acceptance Criteria:**

**Given** the architecture document specifies `create-next-app` with specific flags
**When** I run the initialization command
**Then** the project is created with:
- Next.js 15+ with App Router
- TypeScript configured with strict mode
- Tailwind CSS configured
- Import alias `@/*` configured
- No `src` directory structure
**And** the project structure matches the architecture document's base structure
**And** ESLint is configured
**And** the project can be started with `npm run dev`

**Technical Notes:**
- Command: `npx create-next-app@latest infin8content --typescript --tailwind --app --no-src-dir --import-alias "@/*"`
- This is Epic 1 Story 1 as specified in Architecture document

---

### Story 1.2: Supabase Project Setup and Database Schema Foundation

**Priority:** P0 (MVP - Foundation)

As a developer,
I want to set up Supabase project and create the foundational database schema,
So that I have the database infrastructure for multi-tenant authentication and data isolation.

**Acceptance Criteria:**

**Given** the project is initialized (Story 1.1)
**When** I configure Supabase integration
**Then** the Supabase client is configured with environment variables
**And** the following base tables are created:
- `organizations` table with columns: `id` (UUID, primary key), `name` (TEXT), `plan` (TEXT: 'starter', 'pro', 'agency'), `white_label_settings` (JSONB), `created_at` (TIMESTAMP), `updated_at` (TIMESTAMP)
- `users` table with columns: `id` (UUID, primary key), `email` (TEXT, unique), `org_id` (UUID, foreign key to organizations), `role` (TEXT: 'owner', 'editor', 'viewer'), `created_at` (TIMESTAMP)
**And** foreign key constraints are properly set up
**And** basic indexes are created on `org_id` and `email`
**And** Supabase migrations are set up in `supabase/migrations/` directory

**Technical Notes:**
- Uses Supabase Postgres as specified in Architecture
- Tables follow naming conventions from Architecture document
- This creates only the minimal schema needed for authentication foundation

---

### Story 1.3: User Registration with Email and Password

**Priority:** P0 (MVP - Required for user access)

As a new user,
I want to create an account with my email and password,
So that I can access the platform after completing payment.

**Acceptance Criteria:**

**Given** I am on the registration page
**When** I enter a valid email address and password (minimum 8 characters)
**Then** a user account is created in Supabase Auth
**And** a record is created in the `users` table
**And** an email verification link is sent to my email address
**And** I am redirected to the email verification page
**And** I cannot access the dashboard until email is verified
**And** password is hashed using Supabase Auth's secure hashing
**And** duplicate email addresses are rejected with a clear error message

**Given** I enter an invalid email format
**When** I submit the registration form
**Then** I see a validation error message
**And** the account is not created

**Given** I enter a password less than 8 characters
**When** I submit the registration form
**Then** I see a password strength error message
**And** the account is not created

**Technical Notes:**
- Uses Supabase Auth for user management
- Email verification is required before account activation
- Account creation does NOT grant dashboard access (payment required - see Story 1.7)

---

### Story 1.4: User Login and Session Management

**Priority:** P0 (MVP - Required for user access)

As a registered user,
I want to log in with my email and password,
So that I can access my account and the platform features I've paid for.

**Acceptance Criteria:**

**Given** I have a verified account
**When** I enter my correct email and password on the login page
**Then** I am authenticated via Supabase Auth
**And** a JWT session token is created with 24-hour expiration (NFR-S3)
**And** I am redirected based on my payment status:
- If payment is confirmed: Redirect to dashboard
- If payment is not confirmed: Redirect to payment page
**And** my session persists across page refreshes
**And** my user role and organization are loaded into session context

**Given** I enter incorrect credentials
**When** I submit the login form
**Then** I see a generic error message ("Invalid email or password")
**And** my account is not locked after failed attempts (rate limiting handled by Supabase)

**Given** my session token expires (24 hours of inactivity)
**When** I try to access a protected route
**Then** I am redirected to the login page
**And** I see a message that my session has expired

**Technical Notes:**
- Session timeout: 24 hours (NFR-S3)
- JWT tokens managed by Supabase Auth
- Payment status check determines redirect destination

---

### Story 1.5: OAuth Authentication (Google and GitHub)

**Priority:** P1 (Post-MVP - Convenience feature)

As a user,
I want to sign up or log in using my Google or GitHub account,
So that I can access the platform without creating a separate password.

**Acceptance Criteria:**

**Given** I am on the registration or login page
**When** I click "Sign in with Google" or "Sign in with GitHub"
**Then** I am redirected to the OAuth provider's authentication page
**And** after successful authentication, I am redirected back to the platform
**And** if this is my first time, a user account is automatically created
**And** if I already have an account, I am logged in
**And** my email address is verified automatically (OAuth providers verify emails)
**And** I am redirected based on my payment status (same as Story 1.4)

**Given** I cancel the OAuth flow
**When** I am redirected back to the platform
**Then** I see a message that authentication was cancelled
**And** I remain on the login/registration page

**Given** OAuth provider returns an error
**When** I am redirected back to the platform
**Then** I see a clear error message
**And** I can retry or use email/password authentication

**Technical Notes:**
- OAuth 2.0 flow via Supabase Auth
- Google and GitHub providers configured in Supabase dashboard
- Email verification not required for OAuth (providers verify)

---

### Story 1.6: Organization Creation and Management

**Priority:** P0 (MVP - Multi-tenant foundation)

As a new user,
I want to create an organization when I first sign up,
So that I can manage my content and team members under my organization.

**Acceptance Criteria:**

**Given** I have just completed registration and email verification
**When** I am prompted to create an organization
**Then** I can enter an organization name
**And** an organization record is created in the `organizations` table
**And** I am automatically assigned as the organization owner (role: 'owner')
**And** my user record is linked to this organization (`org_id` foreign key)
**And** the organization is created with default plan: 'starter'
**And** I can see my organization name in my account settings

**Given** I am an organization owner
**When** I navigate to organization settings
**Then** I can view my organization details (name, plan, created date)
**And** I can update the organization name
**And** changes are saved to the database
**And** I see a success message after updating

**Given** I try to create a second organization
**When** I attempt to create another organization
**Then** I see a message that I can only have one organization (or upgrade to Agency plan for multiple - future feature)
**And** the second organization is not created

**Technical Notes:**
- Organization creation happens automatically after first registration
- One organization per user initially (can be expanded for Agency plan later)
- Organization owner role is assigned automatically

---

### Story 1.7: Stripe Payment Integration and Subscription Setup

**Priority:** P0 (MVP - Payment-first model)

As a new user,
I want to select a subscription plan and complete payment,
So that I can access the platform features according to my plan tier.

**Acceptance Criteria:**

**Given** I have created an account and organization (Stories 1.3-1.6)
**When** I am redirected to the payment page after registration
**Then** I see three plan options:
- Starter: $59/month (annual) or $89/month (monthly)
- Pro: $175/month (annual) or $220/month (monthly)
- Agency: $299/month (annual) or $399/month (monthly)
**And** I can see feature comparisons for each plan
**And** I can select annual or monthly billing
**And** I can click "Subscribe" to proceed to Stripe checkout

**Given** I have selected a plan and billing frequency
**When** I click "Subscribe"
**Then** I am redirected to Stripe Checkout
**And** I can enter my payment information securely
**And** after successful payment, Stripe webhook creates a subscription record
**And** my organization's `plan` field is updated in the database
**And** a Stripe customer ID and subscription ID are stored
**And** I am redirected back to the platform with payment confirmed
**And** my account status is set to "active"

**Given** payment fails (declined card, insufficient funds)
**When** Stripe returns a payment error
**Then** I see a clear error message with actionable next steps
**And** I can retry payment or select a different payment method
**And** my account remains in "pending_payment" status

**Technical Notes:**
- Stripe Checkout for payment processing (PCI DSS compliance via Stripe - NFR-S5)
- Webhook handler for subscription creation/updates
- Subscription data stored in `organizations` table or separate `subscriptions` table
- Payment status tracked in user/organization record

---

### Story 1.8: Payment-First Access Control (Paywall Implementation)

**Priority:** P0 (MVP - Enforces payment requirement)

As the system,
I want to enforce payment before dashboard access,
So that only paying customers can use the platform features.

**Acceptance Criteria:**

**Given** a user has registered but not completed payment
**When** they try to access any dashboard route
**Then** they are redirected to the payment page
**And** they see a message: "Please complete payment to access the dashboard"
**And** they cannot access any protected routes except:
- Payment page
- Account settings (limited view)
- Logout

**Given** a user has completed payment
**When** they try to access dashboard routes
**Then** they have full access to all features according to their plan tier
**And** plan-based feature gating is enforced (FR5)

**Given** a user's payment fails (card declined, subscription cancelled)
**When** their subscription status changes to "past_due" or "canceled"
**Then** their account enters a 7-day grace period
**And** they receive an email notification about payment failure (FR134)
**And** they can still access the dashboard during the grace period
**And** after 7 days, their account is suspended (FR132)

**Given** a suspended user completes payment
**When** payment is successfully processed
**Then** their account is automatically reactivated (FR133)
**And** they regain full dashboard access
**And** they receive a confirmation email

**Technical Notes:**
- Middleware/route protection checks payment status before allowing access
- Grace period: 7 days (FR132)
- Account suspension after grace period expires
- Automatic reactivation upon successful payment

---

### Story 1.9: Account Suspension and Reactivation Workflow

**Priority:** P1 (Post-MVP - Can use simple payment check)

As the system,
I want to suspend accounts after payment failure and reactivate them upon successful payment,
So that I maintain payment compliance while giving users a grace period to resolve issues.

**Acceptance Criteria:**

**Given** a user's payment fails and grace period (7 days) has expired
**When** the system processes the suspension
**Then** the user's account status is set to "suspended"
**And** the user cannot access the dashboard (FR131)
**And** the user sees a suspension message with payment retry option
**And** an email notification is sent explaining the suspension (FR134)

**Given** a suspended user attempts to log in
**When** they authenticate successfully
**Then** they are redirected to a suspension page
**And** they see a clear message about why their account is suspended
**And** they see a "Retry Payment" button
**And** they cannot access any dashboard features

**Given** a suspended user completes payment
**When** Stripe webhook confirms successful payment
**Then** the account status is automatically updated to "active" (FR133)
**And** the user receives a reactivation confirmation email
**And** the user can immediately access the dashboard
**And** all previous data and settings are restored

**Given** a user is in the 7-day grace period
**When** they access the dashboard
**Then** they see a warning banner about payment failure
**And** they see the number of days remaining in grace period
**And** they can click to retry payment
**And** they retain full dashboard access during grace period

**Technical Notes:**
- Grace period: 7 days from payment failure (FR132)
- Automatic suspension after grace period
- Automatic reactivation upon payment success
- Email notifications at key points (FR134)

---

### Story 1.10: Team Member Invites and Role Assignments

**Priority:** P1 (Post-MVP - MVP is single-user)

As an organization owner,
I want to invite team members and assign them roles,
So that my team can collaborate on content with appropriate permissions.

**Acceptance Criteria:**

**Given** I am an organization owner with an active subscription
**When** I navigate to Team Settings
**Then** I can see a list of current team members
**And** I can see an "Invite Team Member" button
**And** I can see the role of each team member (Owner, Editor, Viewer)

**Given** I click "Invite Team Member"
**When** I enter an email address and select a role (Editor or Viewer)
**Then** an invitation email is sent to that email address
**And** an invitation record is created with:
- Email address
- Organization ID
- Assigned role
- Invitation token (unique, expires in 7 days)
- Status: "pending"
**And** I see a success message
**And** the invited user appears in the team list with status "Pending"

**Given** a user receives a team invitation email
**When** they click the invitation link
**Then** if they don't have an account, they are prompted to create one
**And** if they have an account, they are logged in
**And** they are added to the organization with the assigned role
**And** the invitation status is updated to "accepted"
**And** they are redirected to the dashboard
**And** the organization owner receives a notification

**Given** an invitation expires (7 days)
**When** the invited user tries to accept it
**Then** they see an error message that the invitation has expired
**And** the organization owner can resend the invitation

**Given** I am an organization owner
**When** I view a team member
**Then** I can change their role (Editor ↔ Viewer)
**And** I can remove them from the organization
**And** changes take effect immediately
**And** the team member receives a notification about role changes

**Technical Notes:**
- Roles: Owner, Editor, Viewer (FR3)
- Invitation tokens expire in 7 days
- Role changes require owner permissions
- Team member removal revokes access immediately

---

### Story 1.11: Row-Level Security (RLS) Policies Implementation

**Priority:** P1 (Post-MVP - Can defer with basic org_id checks)

As the system,
I want to enforce row-level security policies on all tables,
So that users can only access data belonging to their organization.

**Acceptance Criteria:**

**Given** database tables have been created
**When** RLS policies are implemented
**Then** all tables with `org_id` foreign keys have RLS enabled
**And** policies enforce that users can only SELECT/INSERT/UPDATE/DELETE rows where `org_id` matches their organization
**And** policies use Supabase's `auth.uid()` and organization lookup functions
**And** cross-organization data access is prevented (FR11)

**Given** a user from Organization A
**When** they query any table with RLS enabled
**Then** they only see rows where `org_id` = Organization A's ID
**And** they cannot see, modify, or delete rows from Organization B
**And** attempts to access other organizations' data return empty results (not errors)

**Given** a user tries to insert a row with a different `org_id`
**When** they attempt the insert
**Then** the insert is rejected or the `org_id` is automatically set to their organization
**And** they see an error message if the insert is rejected

**Given** RLS policies are in place
**When** automated tests are run
**Then** tests verify that cross-organization access is prevented
**And** tests verify that same-organization access works correctly
**And** zero cross-organization data leakage incidents (NFR-S2)

**Technical Notes:**
- RLS policies on all multi-tenant tables (FR10)
- Uses Supabase RLS with `org_id` foreign key pattern
- Policies prevent cross-organization access (FR11)
- Testing required to verify isolation

---

### Story 1.12: Basic Dashboard Access After Payment

**Priority:** P0 (MVP - Users need dashboard to navigate)

As a paying user,
I want to access a basic dashboard after completing payment,
So that I can see my account status and navigate to platform features.

**Acceptance Criteria:**

**Given** I have completed payment (Story 1.7)
**When** I log in or am redirected after payment
**Then** I can access the main dashboard route
**And** I see a basic dashboard layout with:
- Top navigation bar with user menu
- Left sidebar navigation (collapsible)
- Main content area
- Welcome message with my name
**And** the dashboard loads in < 2 seconds (NFR-P2)
**And** I can see my organization name and plan tier
**And** I can navigate to account settings

**Given** I try to access the dashboard without payment
**When** I navigate to the dashboard route
**Then** I am redirected to the payment page (enforced by Story 1.8)
**And** I cannot see any dashboard content

**Given** my payment status changes to suspended
**When** I try to access the dashboard
**Then** I am redirected to the suspension page (Story 1.9)
**And** I cannot see dashboard content

**Technical Notes:**
- Basic dashboard structure (full dashboard features in Epic 2)
- Payment status check before rendering
- Responsive layout foundation
- Navigation structure for future features

---

### Story 1.13: Audit Logging for Compliance

**Priority:** P1 (Post-MVP - Not required for MVP)

As the system,
I want to log all sensitive operations,
So that I can maintain compliance and track security-relevant actions.

**Acceptance Criteria:**

**Given** sensitive operations occur in the system
**When** any of the following actions happen:
- Billing changes (subscription upgrades, downgrades, cancellations)
- Team member invites or removals
- Role changes
- Data exports (GDPR/CCPA)
- Account deletions
- Payment failures or reactivations
**Then** an audit log entry is created with:
- Timestamp
- User ID who performed the action
- Organization ID
- Action type
- Action details (JSON)
- IP address
- User agent
**And** audit logs are stored in an `audit_logs` table
**And** audit logs are retained for 90 days minimum (NFR-S8)

**Given** an organization owner requests audit logs
**When** they navigate to Audit Logs in settings
**Then** they can view audit logs for their organization
**And** logs are filtered to show only their organization's actions
**And** logs are sortable by date, user, and action type
**And** logs can be exported as CSV

**Given** a compliance officer requests audit logs
**When** they have appropriate permissions
**Then** they can access audit logs across organizations (if needed for compliance)
**And** access to cross-organization logs is itself logged

**Technical Notes:**
- Audit logging for sensitive operations (FR12, NFR-S8)
- 90-day retention minimum
- RLS policies on audit_logs table (organization isolation)
- Logging happens automatically, not manually

---

### Epic 2: Dashboard Foundation & User Experience
**User Outcome:** Users have a complete, responsive dashboard experience with persona-specific views, real-time updates, and intuitive navigation.

**FRs covered:** FR138-FR160 (dashboard-specific FRs)

**Key Capabilities:**
- Main dashboard with persona-specific default views
- Real-time usage credits display
- Success metrics visualization (time saved, content output, ROI)
- Recent activity feed
- Quick action buttons
- Multi-client switcher (for agencies)
- Customizable widget layout
- Search functionality (Cmd/Ctrl + K)
- Keyboard shortcuts
- Responsive design (mobile, tablet, desktop)
- Loading and error states
- Empty states with helpful guidance

**Dependencies:** Epic 1 (requires authentication and payment)

**Success Metrics:**
- < 2 seconds dashboard load time (NFR-P2)
- 100% keyboard navigation support (NFR-A2)
- WCAG 2.1 Level AA compliance (NFR-A1)

### Story 2.1: Dashboard Layout Foundation and Navigation Structure

**Priority:** P1 (Post-MVP - UX polish, not blocking)

As a user,
I want a consistent dashboard layout with navigation,
So that I can easily access all platform features from any page.

**Acceptance Criteria:**

**Given** I have completed payment and accessed the dashboard (Epic 1)
**When** I view the dashboard
**Then** I see a layout with:
- Left sidebar navigation (240px width, collapsible to 64px)
- Top bar (64px height) with logo, user menu, notifications
- Main content area (responsive, fills remaining space)
- Right contextual panel (optional, collapsible, 40% width when open)
**And** the sidebar contains navigation sections:
  - Research (with sub-items: Keyword Research, Competitor Analysis, SERP Analysis)
  - Write (with sub-items: Articles, Templates, Writing Styles)
  - Publish (with sub-items: CMS Connections, Publishing Queue, Publishing History)
  - Track (with sub-items: Analytics Dashboard, Revenue Attribution, Ranking Performance)
  - Settings (with sub-items: Profile, Organization, Billing, Integrations)
**And** the sidebar can be collapsed/expanded with a toggle button
**And** the active section is highlighted (background color, border-left indicator)
**And** navigation items have icons (24x24px) and labels (14px font)
**And** the layout is responsive (sidebar collapses on mobile < 640px)

**Given** I am on any dashboard page
**When** I click a navigation item
**Then** I am navigated to that section
**And** the URL updates to reflect the current page
**And** the active state updates to show the current section
**And** page transitions are smooth (< 200ms)

**Technical Notes:**
- Layout follows UX Design: Professional & Efficient (Dense) - 4-column grid, 240px sidebar
- Uses Tailwind CSS + shadcn/ui components
- Sidebar is fixed position, main content scrolls independently
- Responsive breakpoints: Mobile <640px, Tablet 640-1024px, Desktop >1024px

---

### Story 2.2: Persona-Specific Default Dashboard Views

**Priority:** P1 (Post-MVP - UX polish, not blocking)

As a user,
I want to see a dashboard customized for my role (Agency, E-Commerce, or SaaS),
So that I see the most relevant metrics and actions for my use case.

**Acceptance Criteria:**

**Given** I am an Agency user (Sarah persona)
**When** I access the main dashboard
**Then** I see the Agency default view with widgets:
- Multi-client overview card (total clients, active projects)
- Time saved counter (hours/week saved, progress toward 10+ hours/week goal)
- Articles generated this month (with trend indicator)
- Client activity feed (recent publications across clients)
- Revenue attribution summary (aggregated across all clients)
- Queue status (articles in progress, pending)
**And** the layout emphasizes multi-client management
**And** I see a client switcher in the top bar (one-click client switching)

**Given** I am an E-Commerce user (Marcus persona)
**When** I access the main dashboard
**Then** I see the E-Commerce default view with widgets:
- Revenue attributed (total $ from content, prominent display)
- Conversion rate improvement (before/after comparison)
- Top-performing articles (by revenue, top 5)
- Product descriptions generated (with completion status)
- Store connection status
- Recent sales attributed to content
**And** the layout emphasizes revenue and conversion metrics
**And** revenue attribution is prominently displayed

**Given** I am a SaaS/Growth user (Jessica persona)
**When** I access the main dashboard
**Then** I see the SaaS default view with widgets:
- Organic traffic growth (visitors/month trend chart)
- Ranking performance (keywords in top 10, average position)
- Articles published this month (with trend)
- Signup attribution (signups from content)
- Content quality metrics (average SEO score, readability)
- Top-performing articles (by traffic, top 5)
**And** the layout emphasizes traffic and ranking metrics
**And** progress toward 10K visitors/month goal is visible

**Given** I have not selected a persona during onboarding
**When** I access the dashboard for the first time
**Then** I see a persona selection prompt
**And** I can select my primary use case (Agency, E-Commerce, SaaS)
**And** the dashboard updates to show the selected persona's default view
**And** I can change my persona preference in settings later

**Technical Notes:**
- Persona selection stored in user profile or organization settings
- Default view determined by persona selection or organization type
- Widgets are data-driven and can be customized (Story 2.7)

---

### Story 2.3: Real-Time Usage Credits Display

**Priority:** P1 (Post-MVP - UX polish, not blocking)

As a user,
I want to see my current usage credits in real-time,
So that I know how many articles, keyword researches, and API calls I have remaining.

**Acceptance Criteria:**

**Given** I am on the dashboard
**When** I view the usage credits widget
**Then** I see my current usage for:
- Articles generated (e.g., "8 of 10 articles used this month")
- Keyword researches (e.g., "45 of 50 keyword researches used")
- API calls (e.g., "850 of 1,000 API calls used")
**And** each metric shows:
  - Current usage / Plan limit
  - Visual progress bar (color-coded: green 0-75%, yellow 76-90%, red 91-100%)
  - Percentage used
  - Days remaining in billing cycle
**And** the data updates in real-time (via websocket or polling every 30 seconds)
**And** if I'm at 90%+ of any limit, I see a warning indicator (FR89)

**Given** I am approaching a usage limit (90% threshold)
**When** I view the usage credits widget
**Then** I see a warning message: "You're approaching your [metric] limit"
**And** I see an "Upgrade Plan" button or link
**And** I receive an email notification (if not already sent)

**Given** I have exceeded a usage limit
**When** I view the usage credits widget
**Then** I see an overage indicator
**And** I see the overage amount and cost
**And** I see a message about overage billing
**And** I can click to upgrade my plan

**Technical Notes:**
- Usage data fetched from `usage_tracking` table (created in Epic 10)
- Real-time updates via Supabase websockets or polling
- Color coding: Green (#10B981), Yellow (#F59E0B), Red (#EF4444)
- Widget follows Metric Card component specifications from UX Design

---

### Story 2.4: Success Metrics Visualization Widgets

**Priority:** P1 (Post-MVP - UX polish, not blocking)

As a user,
I want to see my key success metrics prominently displayed,
So that I can track my progress toward my goals (time saved, content output, ROI).

**Acceptance Criteria:**

**Given** I am on the dashboard
**When** I view the success metrics section
**Then** I see persona-specific success metrics:
- **Agency users:** Time saved (hours/week), Content output (articles/month), Client retention rate
- **E-Commerce users:** Revenue attributed ($), Conversion rate improvement (%), Product descriptions generated
- **SaaS users:** Organic traffic growth (visitors/month), Ranking performance (keywords in top 10), Signup attribution
**And** each metric is displayed in a Metric Card widget with:
  - Large, bold number (32px font, #111827)
  - Label (12px, uppercase, gray)
  - Trend indicator (up/down arrow with percentage change)
  - Comparison period (e.g., "vs last month")
  - Optional mini chart (sparkline) showing trend over time
**And** metrics update in real-time as data changes
**And** I can click a metric card to see detailed analytics

**Given** I am an Agency user
**When** I view the time saved metric
**Then** I see my total hours saved this week
**And** I see progress toward the 10+ hours/week goal
**And** I see a celebration message when I hit the goal: "You've saved 10+ hours this week! 🎉"

**Given** I am an E-Commerce user
**When** I view the revenue attributed metric
**Then** I see total revenue attributed to content (e.g., "$12,450")
**And** I see the trend (e.g., "+$2,100 vs last month")
**And** I see a link to detailed revenue attribution reports

**Given** I am a SaaS user
**When** I view the traffic growth metric
**Then** I see current monthly visitors (e.g., "7,500 visitors")
**And** I see progress toward 10K visitors/month goal
**And** I see a trend chart showing growth over time

**Technical Notes:**
- Metrics calculated from usage data, article performance, and analytics
- Real-time updates via websockets
- Metric Card component follows UX Design specifications
- Trend calculations compare current period to previous period

---

### Story 2.5: Recent Activity Feed Widget

**Priority:** P1 (Post-MVP - UX polish, not blocking)

As a user,
I want to see a feed of recent activities in my account,
So that I can stay informed about article generation, publishing, and other important events.

**Acceptance Criteria:**

**Given** I am on the dashboard
**When** I view the activity feed widget
**Then** I see a list of recent activities (last 10-20 activities) including:
- Article generated: "Article 'Title' generated" (green icon, timestamp)
- Article published: "Article published to WordPress" (blue icon, timestamp)
- Revenue attributed: "$X attributed to article 'Title'" (purple icon, timestamp)
- Error occurred: "Failed to publish article 'Title'" (red icon, timestamp)
- Keyword research completed: "Keyword research for 'keyword' completed" (blue icon, timestamp)
**And** each activity item shows:
  - Icon (32x32px, circular background, colored by activity type)
  - Title (14px, bold)
  - Description (12px, gray)
  - Timestamp (12px, gray, relative: "2 hours ago")
  - Optional action link ("View" link, 12px, primary color)
**And** the feed is scrollable (max height 400px)
**And** activities are sorted by most recent first
**And** the feed updates in real-time via websockets

**Given** I click on an activity item
**When** the activity has an associated resource (article, keyword research, etc.)
**Then** I am navigated to the detail page for that resource
**And** the activity feed remains in context

**Given** I have no recent activities
**When** I view the activity feed widget
**Then** I see an empty state message: "No recent activity. Create your first article to get started!"
**And** I see a "Create Article" button or link

**Technical Notes:**
- Activity feed data from `activity_logs` table (created in Epic 1 or Epic 9)
- Real-time updates via Supabase websockets
- Activity Feed Widget follows UX Design specifications
- Icons use Heroicons or similar icon library

---

### Story 2.6: Quick Action Buttons

**Priority:** P1 (Post-MVP - UX polish, not blocking)

As a user,
I want quick access to common actions from the dashboard,
So that I can start creating content or performing key tasks immediately.

**Acceptance Criteria:**

**Given** I am on the dashboard
**When** I view the quick actions section
**Then** I see prominent action buttons:
- "Generate Article" (primary button, large)
- "Research Keywords" (secondary button)
- "View Reports" (secondary button)
**And** buttons are clearly labeled with icons
**And** buttons are positioned prominently (top of dashboard or floating action button)

**Given** I click "Generate Article"
**When** I have available article credits
**Then** I am navigated to the article generation flow
**And** the article generation process begins

**Given** I click "Generate Article"
**When** I have no available article credits
**Then** I see a message: "You've reached your article limit for this month"
**And** I see an "Upgrade Plan" button
**And** I see my current usage and plan limits

**Given** I click "Research Keywords"
**Then** I am navigated to the keyword research page
**And** the keyword research interface loads

**Given** I click "View Reports"
**Then** I am navigated to the analytics/reports page
**And** I see my performance reports

**Technical Notes:**
- Quick actions are context-aware (check usage limits before allowing actions)
- Buttons follow Button component specifications from UX Design
- Primary button: Large (48px height), secondary buttons: Default (40px height)

---

### Story 2.7: Customizable Widget Layout

**Priority:** P1 (Post-MVP - UX polish, not blocking)

As a user,
I want to customize my dashboard widget layout,
So that I can arrange widgets to match my workflow and priorities.

**Acceptance Criteria:**

**Given** I am on the dashboard
**When** I view the widget layout
**Then** I see widgets arranged in a grid (4 columns on desktop, responsive on mobile/tablet)
**And** I can drag widgets to reorder them
**And** I can see a "Customize Layout" button or icon

**Given** I click "Customize Layout"
**When** I enter customization mode
**Then** widgets become draggable
**And** I see drop zones showing where widgets can be placed
**And** I can drag widgets to new positions
**And** I can remove widgets (hide them from dashboard)
**And** I can add widgets from a widget library
**And** I see a "Save Layout" button

**Given** I rearrange widgets and click "Save Layout"
**When** the layout is saved
**Then** my widget arrangement is persisted to my user preferences
**And** the dashboard updates to show my custom layout
**And** I see a success message: "Dashboard layout saved"
**And** my custom layout is restored on future visits

**Given** I remove a widget from my dashboard
**When** I save the layout
**Then** the widget is hidden from my dashboard
**And** I can add it back later from the widget library

**Given** I am in customization mode
**When** I click "Cancel" or press Escape
**Then** customization mode exits
**And** my layout reverts to the last saved state
**And** no changes are persisted

**Technical Notes:**
- Widget layout stored in `user_preferences` table or `organizations.dashboard_layout` JSONB column
- Drag-and-drop using react-beautiful-dnd or similar library
- Grid layout: 4 columns desktop, 2 columns tablet, 1 column mobile
- Widget library includes all available widgets with descriptions

---

### Story 2.8: Global Search Functionality (Cmd/Ctrl + K)

**Priority:** P1 (Post-MVP - UX polish, not blocking)

As a user,
I want to search across all content using a keyboard shortcut,
So that I can quickly find articles, keywords, clients, or projects.

**Acceptance Criteria:**

**Given** I am anywhere in the dashboard
**When** I press Cmd/Ctrl + K
**Then** a full-screen search modal opens
**And** the search input is automatically focused
**And** I can start typing immediately

**Given** I type a search query in the search modal
**When** I enter text (minimum 2 characters)
**Then** search results appear grouped by type:
- Articles (with title, status, date)
- Keywords (with volume, difficulty)
- Clients (with name, project count) - Agency only
- Projects (with name, article count)
**And** results are highlighted with matching text
**And** I see a preview/snippet for each result
**And** results update as I type (debounced, 300ms delay)

**Given** I see search results
**When** I use arrow keys (up/down)
**Then** I can navigate through results
**And** the selected result is highlighted
**And** pressing Enter navigates to the selected result

**Given** I see search results
**When** I click on a result
**Then** I am navigated to that resource's detail page
**And** the search modal closes
**And** the search query is cleared

**Given** I am in the search modal
**When** I press Escape
**Then** the search modal closes
**And** I return to the previous page

**Given** I have no search results
**When** I view the search modal
**Then** I see an empty state: "No results found for '[query]'"
**And** I see suggestions: "Try a different search term" or "Check your spelling"

**Technical Notes:**
- Search implemented using full-text search (PostgreSQL tsvector/tsquery or Supabase full-text search)
- Keyboard shortcut: Cmd/Ctrl + K (global, works from any page)
- Search modal: Full-screen overlay, z-index 1000
- Results grouped by type with icons and previews
- Debounced search (300ms) to avoid excessive API calls

---

### Story 2.9: Keyboard Shortcuts and Help Modal

**Priority:** P1 (Post-MVP - UX polish, not blocking)

As a user,
I want to use keyboard shortcuts for common actions,
So that I can navigate and perform tasks more efficiently.

**Acceptance Criteria:**

**Given** I am anywhere in the dashboard
**When** I press Cmd/Ctrl + /
**Then** a keyboard shortcuts help modal opens
**And** I see all available keyboard shortcuts grouped by category:
  - **Global Shortcuts:**
    - Cmd/Ctrl + K: Open search
    - Cmd/Ctrl + /: Show keyboard shortcuts help
    - Esc: Close modal, cancel action
    - Cmd/Ctrl + N: Create new article (context-dependent)
  - **Navigation Shortcuts:**
    - Cmd/Ctrl + 1-6: Navigate to main sections
    - Cmd/Ctrl + B: Toggle sidebar
    - Arrow Keys: Navigate lists/tables (when focused)
  - **Editor Shortcuts:**
    - Cmd/Ctrl + S: Save
    - Cmd/Ctrl + P: Publish
    - Cmd/Ctrl + B: Bold
    - Cmd/Ctrl + I: Italic
**And** each shortcut shows the key combination and description
**And** shortcuts are searchable within the modal

**Given** I am on the dashboard
**When** I press Cmd/Ctrl + 1
**Then** I am navigated to the Research section
**And** the sidebar highlights the Research section

**Given** I am on the dashboard
**When** I press Cmd/Ctrl + B
**Then** the sidebar toggles (collapses if expanded, expands if collapsed)
**And** the sidebar state is persisted to my preferences

**Given** I am in a list or table view
**When** I focus on the list/table
**Then** I can use arrow keys to navigate items
**And** Enter key selects/opens the focused item
**And** Escape key cancels navigation

**Given** I am in the article editor
**When** I press Cmd/Ctrl + S
**Then** the article is saved
**And** I see a "Saved" indicator

**Given** keyboard shortcuts are enabled
**When** I use a shortcut
**Then** the action executes immediately
**And** shortcuts don't conflict with browser defaults
**And** shortcuts work across all pages

**Technical Notes:**
- Keyboard shortcuts implemented using event listeners (keydown events)
- Shortcuts modal: Searchable, grouped by category
- Shortcut help accessible via Cmd/Ctrl + /
- All shortcuts must be accessible (NFR-A2: 100% keyboard navigation support)

---

### Story 2.10: Responsive Design Implementation

**Priority:** P1 (Post-MVP - UX polish, not blocking)

As a user,
I want the dashboard to work well on mobile, tablet, and desktop devices,
So that I can access the platform from any device.

**Acceptance Criteria:**

**Given** I access the dashboard on a mobile device (< 640px)
**When** I view the dashboard
**Then** the layout adapts to mobile:
- Sidebar is hidden by default (hamburger menu icon in top bar)
- Sidebar slides in/out when hamburger menu is toggled
- Widgets stack vertically (1 column)
- Top bar shows logo and hamburger menu
- Touch targets are larger (minimum 44x44px)
- Tables switch to card view or horizontal scroll
- Modals are full-screen
- Bottom navigation bar for primary actions (optional)
**And** all functionality remains accessible
**And** text is readable (minimum 14px font size)

**Given** I access the dashboard on a tablet (640px - 1024px)
**When** I view the dashboard
**Then** the layout adapts to tablet:
- Sidebar is collapsible (can be hidden)
- Widgets arrange in 2 columns
- Tables can scroll horizontally if needed
- Touch and mouse interactions both work
**And** the layout is optimized for tablet screen size

**Given** I access the dashboard on a desktop (> 1024px)
**When** I view the dashboard
**Then** the layout shows full desktop view:
- Sidebar is visible (240px width)
- Widgets arrange in 4 columns (dense layout)
- All panels visible (sidebar, workspace, contextual panel)
- Full keyboard navigation support
- Optimized for wide screens
**And** the layout follows the Professional & Efficient (Dense) design direction

**Given** I resize my browser window
**When** the window crosses a breakpoint (640px, 1024px)
**Then** the layout adapts smoothly
**And** no content is cut off
**And** all functionality remains accessible

**Technical Notes:**
- Responsive breakpoints: Mobile <640px (sm), Tablet 640-1024px (md, lg), Desktop >1024px (xl, 2xl)
- Uses Tailwind CSS responsive utilities
- Touch targets: Minimum 44x44px on mobile (iOS/Android guidelines)
- Sidebar: Collapsible on mobile/tablet, fixed on desktop
- Grid: 1 column mobile, 2 columns tablet, 4 columns desktop

---

### Story 2.11: Loading States and Skeleton Screens

**Priority:** P1 (Post-MVP - UX polish, not blocking)

As a user,
I want to see loading indicators while data is being fetched,
So that I know the system is working and content is loading.

**Acceptance Criteria:**

**Given** I navigate to the dashboard
**When** data is being loaded
**Then** I see skeleton screens showing the structure of content:
- Skeleton cards for metric widgets (animated gray bars)
- Skeleton rows for activity feed items
- Skeleton table rows for data tables
**And** skeleton screens match the final content layout
**And** skeleton screens have a subtle pulse animation
**And** the dashboard layout is visible (not blank)

**Given** I perform an action that takes time (article generation, publishing)
**When** the action is in progress
**Then** I see a progress indicator:
- Progress bar showing percentage complete
- Spinner for indeterminate progress
- Status message: "Generating article... 45% complete"
**And** I can see what stage the process is in
**And** I can cancel the operation if needed

**Given** I navigate between pages
**When** the new page is loading
**Then** I see a loading spinner or skeleton screen
**And** the transition is smooth (< 200ms)
**And** I don't see a blank page

**Given** data loads quickly (< 500ms)
**When** content appears
**Then** skeleton screens are replaced smoothly
**And** there's no flash of empty content

**Technical Notes:**
- Skeleton screens use shadcn/ui Skeleton component or custom implementation
- Loading states follow UX Design specifications
- Progress indicators for long-running operations (article generation, publishing)
- Smooth transitions prevent layout shift

---

### Story 2.12: Error States with Clear Recovery Actions

**Priority:** P1 (Post-MVP - UX polish, not blocking)

As a user,
I want to see clear error messages with actionable recovery steps,
So that I know what went wrong and how to fix it.

**Acceptance Criteria:**

**Given** an error occurs in the dashboard
**When** I view the error state
**Then** I see a clear error message with:
- Error icon (64x64px, red #EF4444)
- Error title (20px, bold): "Something went wrong"
- Error description (14px): Clear explanation of what failed
- Recovery actions: Primary action button (e.g., "Retry", "Try Again")
- Secondary action link (e.g., "Go back", "Contact support")
**And** the error message is user-friendly (not technical jargon)
**And** I know what action to take next

**Given** a network error occurs
**When** I see the error
**Then** I see a message: "We couldn't connect to the server. Please check your internet connection."
**And** I see a "Retry" button
**And** clicking "Retry" attempts the operation again

**Given** a partial failure occurs (e.g., some operations succeed, others fail)
**When** I view the result
**Then** I see what succeeded and what failed
**And** I see specific error messages for failed operations
**And** I can retry only the failed operations
**Example:** "Tavily research complete, DataForSEO in progress, Publishing failed - Retry"

**Given** I see an error
**When** I click "Retry" or "Try Again"
**Then** the operation is retried
**And** I see a loading state during retry
**And** if retry succeeds, I see a success message
**And** if retry fails, I see the error again with additional help

**Given** I see an error I can't resolve
**When** I view the error state
**Then** I see a "Contact Support" link
**And** clicking it opens support contact options
**And** error details are included for support (technical details hidden but accessible)

**Technical Notes:**
- Error states follow UX Design Error State Component specifications
- Error messages are user-friendly, not technical
- Recovery actions are prominent and clear
- Partial failures show what succeeded vs. what failed
- Support contact easily accessible from error states

---

### Story 2.13: Empty States with Helpful Guidance

**Priority:** P1 (Post-MVP - UX polish, not blocking)

As a user,
I want to see helpful empty states when I have no content,
So that I know what to do next and how to get started.

**Acceptance Criteria:**

**Given** I am a new user with no articles
**When** I view the articles section
**Then** I see an empty state with:
- Icon (64x64px, gray #9CA3AF)
- Title (20px, bold): "No articles yet"
- Description (14px): "Create your first article to get started with Infin8Content"
- Primary CTA button: "Create Your First Article"
- Optional secondary link: "Watch tutorial" or "Learn more"
**And** the empty state is centered and visually appealing
**And** clicking the CTA button starts the article creation flow

**Given** I have no clients (Agency user)
**When** I view the clients section
**Then** I see an empty state: "No clients yet. Add your first client to get started."
**And** I see an "Add Client" button
**And** clicking it opens the client creation flow

**Given** I have no keyword research history
**When** I view the keyword research section
**Then** I see an empty state: "No keyword research yet. Start researching keywords to discover content opportunities."
**And** I see a "Research Keywords" button

**Given** I have no recent activity
**When** I view the activity feed
**Then** I see an empty state: "No recent activity. Create your first article to get started!"
**And** I see a "Create Article" link

**Given** I search for content with no results
**When** I view search results
**Then** I see an empty state: "No results found for '[query]'"
**And** I see suggestions: "Try a different search term" or "Clear filters"
**And** I can easily modify my search

**Technical Notes:**
- Empty states follow UX Design Empty State Component specifications
- Empty states are contextual (different messages for different sections)
- CTAs are prominent and action-oriented
- Empty states guide users to next steps
- Icons and messaging are friendly and encouraging

---

### Epic 3: Content Research & Discovery
**User Outcome:** Users can research keywords, analyze SERP data, and discover content opportunities with real-time research and citations.

**FRs covered:** FR13-FR20

**Key Capabilities:**
- Keyword research with search volume, difficulty, and trend data
- Filter and organize keyword research results
- Keyword clustering (pillar content + supporting articles)
- Real-time web research with citations (Tavily integration)
- SERP analysis for competitor intelligence
- Keyword research history and saved lists
- Related keyword suggestions
- Batch keyword research operations

**Dependencies:** Epic 1 (requires authentication)

**Success Metrics:**
- < 60 seconds keyword research completion (NFR-P1 breakdown)
- 80%+ articles include 3+ citations (NFR-DQ2)

### Story 3.1: Keyword Research Interface and DataForSEO Integration

**Priority:** P0 (MVP - Core value, users need keywords to generate articles)

As a user,
I want to research keywords with search volume, difficulty, and trend data,
So that I can identify content opportunities and prioritize keywords for my content strategy.

**Acceptance Criteria:**

**Given** I am on the Keyword Research page
**When** I enter a seed keyword (e.g., "best running shoes")
**Then** I can click "Research" or press Enter
**And** the system calls DataForSEO Keywords Data API
**And** I see a loading state with progress indicator
**And** within 60 seconds, I see keyword research results with:
  - Keyword (the search term)
  - Search Volume (monthly searches, e.g., "12,000")
  - Keyword Difficulty (0-100 score, e.g., "45")
  - Trend Data (30-day trend chart/sparkline)
  - CPC (Cost Per Click, if available)
  - Competition Level (Low/Medium/High)
**And** results are displayed in a sortable table
**And** I can see the API cost for this research (tracked for usage limits)

**Given** I enter an invalid or empty keyword
**When** I try to research
**Then** I see a validation error: "Please enter a keyword to research"
**And** the research does not proceed

**Given** DataForSEO API returns an error
**When** the research fails
**Then** I see a clear error message: "Keyword research failed. Please try again."
**And** I see a "Retry" button
**And** clicking "Retry" attempts the research again
**And** the error is logged for monitoring

**Given** I have reached my keyword research limit for the month
**When** I try to research a keyword
**Then** I see a message: "You've reached your keyword research limit for this month"
**And** I see my current usage and plan limits
**And** I see an "Upgrade Plan" button
**And** the research does not proceed

**Technical Notes:**
- DataForSEO Keywords Data API integration
- API cost: ~$0.01-0.1 per keyword research (varies by depth)
- Results cached for 7 days (NFR caching strategy)
- Usage tracked for billing (Epic 10)
- Error handling with retry logic (3 attempts, exponential backoff)

---

### Story 3.2: Filter and Organize Keyword Research Results

**Priority:** P1 (Post-MVP - Basic results sufficient for MVP)

As a user,
I want to filter and organize keyword research results,
So that I can find the most relevant keywords for my content strategy.

**Acceptance Criteria:**

**Given** I have keyword research results displayed
**When** I view the results table
**Then** I can filter results by:
  - Search Volume (min/max range slider or inputs)
  - Keyword Difficulty (min/max range, 0-100)
  - Search Intent (Informational, Navigational, Transactional, Commercial)
  - Competition Level (Low, Medium, High)
**And** I can sort results by:
  - Search Volume (ascending/descending)
  - Keyword Difficulty (ascending/descending)
  - Trend (ascending/descending)
  - Alphabetical (A-Z, Z-A)
**And** filters are applied in real-time as I adjust them
**And** I see the count of filtered results (e.g., "Showing 25 of 150 keywords")

**Given** I apply multiple filters
**When** I view the results
**Then** all filters are applied together (AND logic)
**And** I can see which filters are active (badges or indicators)
**And** I can clear individual filters or clear all filters

**Given** I have filtered results
**When** I want to save my filter preferences
**Then** I can save the current filter combination as a "Saved Filter"
**And** I can name the saved filter (e.g., "High Volume, Low Difficulty")
**And** I can access saved filters from a dropdown
**And** applying a saved filter restores all filter settings

**Given** I have a large result set (100+ keywords)
**When** I view the results
**Then** results are paginated (10, 25, 50, 100 per page)
**And** I can navigate between pages
**And** I see pagination info: "Showing 1-25 of 150 keywords"
**And** filters and sorting are preserved across pages

**Technical Notes:**
- Client-side filtering for instant feedback (if results < 1000)
- Server-side filtering for large result sets (if results > 1000)
- Saved filters stored in `user_preferences` or `saved_filters` table
- Filter state persisted in URL query parameters for shareability

---

### Story 3.3: Keyword Clustering (Pillar Content Strategy)

**Priority:** P1 (Post-MVP - Advanced feature)

As a user,
I want to generate keyword clusters that group related keywords,
So that I can create a pillar content strategy with main articles and supporting content.

**Acceptance Criteria:**

**Given** I have keyword research results
**When** I click "Generate Clusters" or "Cluster Keywords"
**Then** the system analyzes keyword relationships and intent
**And** keywords are grouped into clusters (e.g., "Running Shoes - Main", "Running Shoes - Types", "Running Shoes - Reviews")
**And** each cluster shows:
  - Cluster name/title (auto-generated or editable)
  - Number of keywords in cluster
  - Average search volume for cluster
  - Average difficulty for cluster
  - List of keywords in the cluster (expandable)
**And** clusters are displayed in an organized view (cards or expandable sections)
**And** I can see which cluster is recommended as the "pillar" (main article)

**Given** I view keyword clusters
**When** I expand a cluster
**Then** I see all keywords in that cluster
**And** I can see keyword details (volume, difficulty, trend)
**And** I can remove keywords from a cluster
**And** I can add keywords to a cluster (drag-and-drop or select)

**Given** I have generated clusters
**When** I want to use clusters for content planning
**Then** I can select a cluster and click "Create Pillar Article"
**And** this navigates to article generation with the cluster's keywords pre-selected
**And** I can select multiple clusters to create a content plan
**And** I can export clusters as CSV or JSON

**Given** I want to manually create clusters
**When** I select multiple keywords from research results
**Then** I can click "Create Cluster"
**And** I can name the cluster
**And** selected keywords are added to the new cluster
**And** the cluster appears in my cluster list

**Technical Notes:**
- Clustering algorithm: Keyword similarity based on:
  - Semantic similarity (using embeddings or keyword co-occurrence)
  - Search intent matching
  - Topic modeling
- Clusters stored in `keyword_clusters` table
- Pillar identification: Highest search volume + lowest difficulty in cluster
- Clustering can use DataForSEO Labs API or custom algorithm

---

### Story 3.4: Real-Time Web Research with Tavily Integration

**Priority:** P1 (Post-MVP - Already included in 4a-3)

As a user,
I want to perform real-time web research with citations,
So that I can gather current facts and sources for my content (EEAT compliance).

**Acceptance Criteria:**

**Given** I am researching a keyword or topic
**When** I click "Research Web Sources" or "Get Real-Time Research"
**Then** the system calls Tavily API with my query
**And** I see a loading state: "Researching web sources..."
**And** within 10-15 seconds, I see research results with:
  - Source title
  - Source URL
  - Relevant excerpt/snippet
  - Relevance score (if available)
  - Publication date (if available)
**And** results are displayed in a list or card view
**And** I can see up to 20 sources per query (Tavily limit)
**And** I can click a source to view full content (opens in new tab)
**And** sources are automatically formatted as citations (ready for article inclusion)

**Given** I have Tavily research results
**When** I view the results
**Then** I can select sources to include in my article
**And** selected sources are marked with a checkmark
**And** I can see a count: "5 of 20 sources selected"
**And** selected sources are saved for article generation

**Given** Tavily API returns an error
**When** the research fails
**Then** I see a clear error message: "Web research failed. Please try again."
**And** I see a "Retry" button
**And** clicking "Retry" attempts the research again (with exponential backoff)
**And** partial results are shown if some queries succeeded

**Given** I want to research a specific topic
**When** I enter a research query (different from keyword)
**Then** Tavily searches for current information on that topic
**And** results include recent sources (prioritize recent publications)
**And** citations are formatted correctly (author, title, URL, date)

**Technical Notes:**
- Tavily API integration: $0.08 per query
- API cost tracked for usage limits and billing
- Results cached for 24 hours (NFR caching strategy)
- Citations formatted for EEAT compliance (author, title, URL, date)
- Error handling with retry logic (3 attempts, exponential backoff)

---

### Story 3.5: SERP Analysis with DataForSEO Integration

**Priority:** P1 (Post-MVP - Optimization, not required)

As a user,
I want to analyze SERP data for target keywords,
So that I can understand what ranks, identify competitors, and optimize my content strategy.

**Acceptance Criteria:**

**Given** I have a keyword selected
**When** I click "Analyze SERP" or "View SERP Data"
**Then** the system calls DataForSEO SERP API
**And** I see a loading state: "Analyzing search results..."
**And** within 30 seconds, I see SERP analysis with:
  - Top 10 ranking URLs
  - Page titles and meta descriptions
  - Domain authority/strength metrics
  - Content type (article, video, product page, etc.)
  - Featured snippet (if present)
  - People Also Ask (PAA) questions
  - Related searches
**And** results are displayed in an organized view
**And** I can click a ranking URL to view the page (opens in new tab)

**Given** I view SERP analysis results
**When** I examine the top-ranking pages
**Then** I can see:
  - Word count of top-ranking articles
  - Heading structure (H1, H2, H3 analysis)
  - Internal/external link counts
  - Image count
  - Schema markup types (if detected)
**And** I can see competitor analysis:
  - Which domains dominate the SERP
  - Average content length of top results
  - Common topics/themes in top results
**And** I can export SERP data as CSV or PDF

**Given** I want to compare multiple keywords
**When** I select multiple keywords and click "Compare SERPs"
**Then** I see a comparison view showing:
  - Overlapping domains across SERPs
  - Different ranking patterns
  - Content strategy differences
**And** I can identify content gaps and opportunities

**Given** DataForSEO SERP API returns an error
**When** the analysis fails
**Then** I see a clear error message: "SERP analysis failed. Please try again."
**And** I see a "Retry" button
**And** clicking "Retry" attempts the analysis again

**Technical Notes:**
- DataForSEO SERP API: $0.0006-0.002 per SERP
- API cost tracked for usage limits and billing
- Results cached for 7 days (NFR caching strategy - SERP data changes slowly)
- SERP data used for content optimization (Epic 4A)
- Error handling with retry logic

---

### Story 3.6: Keyword Research History and Saved Lists

**Priority:** P1 (Post-MVP - Convenience feature)

As a user,
I want to view my keyword research history and save keyword lists,
So that I can reference previous research and organize keywords for content planning.

**Acceptance Criteria:**

**Given** I have performed keyword research
**When** I navigate to "Keyword Research History"
**Then** I see a list of all my previous keyword research sessions with:
  - Seed keyword used
  - Date and time of research
  - Number of keywords found
  - Research parameters (filters applied)
  - Quick actions: "View Results", "Delete", "Re-run Research"
**And** research sessions are sorted by most recent first
**And** I can filter history by date range
**And** I can search history by seed keyword

**Given** I have keyword research results
**When** I want to save keywords for later
**Then** I can select keywords (checkbox or multi-select)
**And** I can click "Save to List"
**And** I can create a new list or add to an existing list
**And** I can name the list (e.g., "Q1 Content Plan", "Product Keywords")
**And** saved lists are stored and accessible from "Saved Lists" section

**Given** I have saved keyword lists
**When** I view "Saved Lists"
**Then** I see all my saved lists with:
  - List name
  - Number of keywords
  - Date created
  - Last modified date
  - Quick actions: "View", "Edit", "Delete", "Export"
**And** I can click a list to view all keywords in that list
**And** I can edit list name or description
**And** I can add/remove keywords from lists

**Given** I have a saved keyword list
**When** I want to use it for content creation
**Then** I can select the list and click "Create Articles from List"
**And** this navigates to article generation with list keywords pre-selected
**And** I can export lists as CSV or JSON

**Given** I want to organize my research
**When** I view keyword research history
**Then** I can tag research sessions (e.g., "Q1 Planning", "Competitor Analysis")
**And** I can filter by tags
**And** I can see tag counts

**Technical Notes:**
- Research history stored in `keyword_research_sessions` table
- Saved lists stored in `keyword_lists` table
- History includes research parameters for reproducibility
- Lists support organization and content planning workflows

---

### Story 3.7: Related Keyword Suggestions

**Priority:** P1 (Post-MVP - Advanced feature)

As a user,
I want to see related keyword suggestions based on my seed keyword,
So that I can discover additional content opportunities I might have missed.

**Acceptance Criteria:**

**Given** I have entered a seed keyword
**When** I view keyword research results
**Then** I see a "Related Keywords" section with:
  - Long-tail variations (e.g., "best running shoes for marathons" from "running shoes")
  - Question-based keywords (e.g., "what are the best running shoes?")
  - Comparison keywords (e.g., "nike vs adidas running shoes")
  - Intent variations (informational, commercial, transactional)
**And** related keywords show search volume and difficulty
**And** I can click a related keyword to research it
**And** I can add related keywords to my current research results

**Given** I am viewing keyword research results
**When** I click "Show More Related Keywords"
**Then** the system calls DataForSEO Keywords Data API for related terms
**And** I see additional related keyword suggestions
**And** suggestions are grouped by type (long-tail, questions, comparisons)
**And** I can see why each keyword is related (semantic similarity, co-occurrence)

**Given** I want to discover content gaps
**When** I view related keyword suggestions
**Then** I can see keywords with:
  - High search volume but low competition (opportunities)
  - Trending keywords (increasing search volume)
  - Seasonal keywords (if applicable)
**And** opportunities are highlighted or marked
**And** I can filter related keywords by opportunity score

**Given** I have related keyword suggestions
**When** I want to research multiple related keywords
**Then** I can select multiple related keywords
**And** I can click "Research Selected" to batch research them (Story 3.8)
**And** all selected keywords are researched together

**Technical Notes:**
- Related keywords from DataForSEO Keywords Data API
- Suggestions based on:
  - Semantic similarity
  - Search query patterns
  - Co-occurrence analysis
  - User search behavior data
- Opportunity scoring: High volume + Low difficulty = High opportunity

---

### Story 3.8: Batch Keyword Research Operations

**Priority:** P1 (Post-MVP - Efficiency, not required)

As a user,
I want to research multiple keywords in one operation,
So that I can efficiently analyze multiple topics and save time.

**Acceptance Criteria:**

**Given** I have a list of keywords (from saved list, manual entry, or related keywords)
**When** I select multiple keywords or enter multiple keywords (one per line)
**Then** I can click "Research All" or "Batch Research"
**And** the system queues all keywords for research
**And** I see a batch research progress indicator:
  - Total keywords: 10
  - Completed: 3
  - In Progress: 1
  - Remaining: 6
  - Estimated time remaining
**And** research happens in parallel (up to 5 concurrent API calls)
**And** results appear as each keyword completes

**Given** I am running batch keyword research
**When** some keywords complete successfully and others fail
**Then** I see which keywords succeeded and which failed
**And** failed keywords show error messages
**And** I can retry failed keywords individually
**And** successful results are displayed immediately
**And** I can continue working with completed results while batch continues

**Given** I have batch research results
**When** all keywords are researched
**Then** I see a summary:
  - Total keywords researched: 10
  - Successful: 9
  - Failed: 1
  - Total API cost: $X.XX
  - Total time: X seconds
**And** I can export all results as CSV or JSON
**And** I can save all results to a keyword list
**And** I can filter/sort the combined results

**Given** I want to research keywords from a file
**When** I upload a CSV or text file with keywords
**Then** the system parses the file
**And** keywords are extracted (one per line or CSV column)
**And** I can review the extracted keywords before researching
**And** I can remove or edit keywords before batch research
**And** clicking "Research All" processes all keywords from the file

**Given** I have a large batch (50+ keywords)
**When** I start batch research
**Then** the system processes keywords in batches (e.g., 10 at a time)
**And** I can see progress for each batch
**And** I can pause/resume batch research
**And** I can cancel batch research (in-progress keywords complete, queued keywords cancelled)

**Technical Notes:**
- Batch processing via Inngest workers (queue-based)
- Parallel processing: Up to 5 concurrent API calls to DataForSEO
- Progress tracking via websockets (real-time updates)
- Error handling: Individual keyword failures don't stop the batch
- Cost tracking: Total API cost calculated and displayed
- File upload: CSV or TXT file parsing

---

### Epic 4A: Article Generation Core
**User Outcome:** Users can generate long-form articles (3,000+ words) with AI using section-by-section architecture, automatic SEO optimization, and real-time progress tracking.

**FRs covered:** FR21-FR28, FR35

**Key Capabilities:**
- Generate 3,000+ word articles from keywords
- Section-by-section architecture (fresh research per section)
- Automatic citation inclusion (EEAT compliance)
- Automatic SEO optimization (keyword density, headings, meta tags)
- FAQ section generation
- Internal linking suggestions
- Schema markup generation (Article, FAQ, HowTo, Product, Review)
- Image integration with alt text
- Real-time progress tracking (websocket updates)

**Dependencies:** Epic 3 (requires keyword research data)

**Success Metrics:**
- < 5 minutes article generation (99th percentile) - NFR-P1 (North Star Metric)
- 70%+ articles score > 60 on Flesch-Kincaid readability (NFR-DQ1)
- 80%+ articles include 3+ citations (NFR-DQ2)

### Story 4A.1: Article Generation Initiation and Queue Setup

**Priority:** P0 (MVP - Users must be able to start article generation)

As a user,
I want to start generating an article from a keyword,
So that I can create long-form content optimized for SEO.

**Acceptance Criteria:**

**Given** I am on the article generation page
**When** I enter a target keyword (e.g., "best running shoes for marathons")
**Then** I can see generation options:
- Article length (target word count: 1,500, 2,000, 3,000, or custom)
- Writing style/tone (Professional, Conversational, Technical, etc.)
- Target audience (General, B2B, B2C, etc.)
- Optional: Custom instructions or requirements
**And** I can click "Generate Article" to start

**Given** I click "Generate Article"
**When** I have available article credits
**Then** the article generation request is queued via Inngest
**And** I see a confirmation: "Article generation started"
**And** I am redirected to the article editor page with real-time progress
**And** an article record is created in the database with status: "generating"
**And** the article is assigned a unique ID

**Given** I click "Generate Article"
**When** I have no available article credits
**Then** I see a message: "You've reached your article limit for this month"
**And** I see my current usage and plan limits
**And** I see an "Upgrade Plan" button
**And** the article generation does not start

**Given** I have multiple article generation requests
**When** I view the queue status
**Then** I can see:
- Current article being generated (with progress)
- Queued articles (with position in queue)
- Estimated time until my article starts
**And** I can cancel queued articles
**And** queue position updates in real-time

**Technical Notes:**
- Article generation queued via Inngest workers (async processing)
- Article record created in `articles` table with status tracking
- Queue management for concurrent article generations (up to 50 concurrent - NFR-P6)
- Usage tracking decrements article credits immediately upon queue

---

### Story 4A.2: Section-by-Section Architecture and Outline Generation

**Priority:** P0 (MVP - Enables 3,000+ word articles, core differentiator)

As the system,
I want to generate articles using a section-by-section architecture,
So that I can create 3,000+ word articles that beat token limits and maintain quality.

**Acceptance Criteria:**

**Given** an article generation request is queued (Story 4A.1)
**When** the Inngest worker picks up the request
**Then** the system generates an article outline with:
- Introduction section
- 5-10 H2 sections (main topics)
- Each H2 section has 2-4 H3 subsections
- Conclusion section
- FAQ section (optional, based on keyword)
**And** the outline is based on:
  - Keyword research data (from Epic 3)
  - SERP analysis (top-ranking content structure)
  - Content gaps and opportunities
**And** the outline is stored in the article record
**And** the outline generation completes in < 20 seconds (NFR-P1 breakdown)

**Given** an article outline is generated
**When** the system processes the article
**Then** each section is processed independently:
- Introduction: Generated first
- H2 sections: Generated sequentially (one at a time)
- Each H2 section: H3 subsections generated within the section
- Conclusion: Generated last
- FAQ: Generated separately
**And** each section gets fresh research (Tavily + DataForSEO) before writing
**And** token management ensures sections fit within LLM context windows
**And** section coherence is maintained (previous sections included as context)

**Given** a section fails during generation
**When** an error occurs
**Then** the system retries the section (3 attempts with exponential backoff)
**And** if retry succeeds, generation continues with next section
**And** if retry fails, the article status is set to "failed" with error details
**And** the user is notified of the failure
**And** completed sections are preserved (partial article saved)

**Technical Notes:**
- Section-by-section architecture enables 3,000+ word articles (FR22)
- Outline generation uses keyword research and SERP data
- Each section: Fresh Tavily research + DataForSEO SERP analysis
- Token management: Previous sections summarized for context, not full content
- Coherence maintenance: Section summaries + keyword focus maintained across sections

---

### Story 4A.3: Real-Time Research Per Section (Tavily Integration)

**Priority:** P0 (MVP - Citations for EEAT compliance, core differentiator)

As the system,
I want to perform fresh Tavily research for each article section,
So that content includes current facts and citations for EEAT compliance.

**Acceptance Criteria:**

**Given** the system is generating a section (e.g., "Types of Running Shoes")
**When** research is needed for that section
**Then** the system calls Tavily API with a research query based on:
- Section topic/keyword
- Main keyword context
- Previous section content (for coherence)
**And** Tavily returns up to 20 sources with:
  - Source title
  - Source URL
  - Relevant excerpt
  - Publication date
**And** sources are ranked by relevance
**And** top 5-10 most relevant sources are selected for citation

**Given** Tavily research results are received
**When** the section is being written
**Then** citations are automatically included in the section content:
- In-text citations: "According to [Source Title](URL)..."
- Reference list at end of section (if applicable)
- Citations formatted correctly (author, title, URL, date when available)
**And** at least 1-2 citations are included per section
**And** citations are relevant to the section content
**And** citation URLs are valid and accessible

**Given** Tavily API returns an error for a section
**When** research fails
**Then** the system retries (3 attempts with exponential backoff)
**And** if retry succeeds, generation continues
**And** if retry fails, the section is generated without fresh research (uses cached data or general knowledge)
**And** a warning is logged: "Section generated without fresh Tavily research"
**And** the article status notes partial research failure

**Given** multiple sections need research
**When** the system processes sections
**Then** Tavily API calls are made sequentially (one per section)
**And** API costs are tracked per section (~$0.08 per query)
**And** total API costs are calculated and stored
**And** research results are cached for 24 hours (if same query repeated)

**Technical Notes:**
- Tavily API: $0.08 per query, ~5 queries per article (one per major section)
- Citations automatically formatted for EEAT compliance (FR23)
- Research query generation: Section topic + keyword context
- Error handling: Graceful degradation if Tavily fails (continue without fresh research)
- Cost tracking: Per-section API costs tracked for billing

---

### Story 4A.4: SERP Analysis Per Section (DataForSEO Integration)

**Priority:** P1 (Post-MVP - Optimization, not required)

As the system,
I want to analyze SERP data for each section to optimize for rankings,
So that content matches what actually ranks and outperforms competitors.

**Acceptance Criteria:**

**Given** the system is generating a section
**When** SERP analysis is needed
**Then** the system calls DataForSEO SERP API for the section's primary keyword
**And** SERP analysis returns:
  - Top 10 ranking URLs
  - Page titles and meta descriptions
  - Content structure (headings, word count)
  - Internal/external link patterns
  - Schema markup types
**And** the analysis is used to optimize the section:
  - Heading structure matches top-ranking content patterns
  - Word count targets based on top results
  - Topic coverage based on competitor analysis
  - Keyword placement optimized

**Given** SERP analysis is received
**When** the section is being written
**Then** the LLM prompt includes SERP insights:
- "Top-ranking articles average 800 words for this section"
- "Common topics in top results: X, Y, Z"
- "Heading structure pattern: H2 → H3 → H3"
- "Keywords to emphasize: [list]"
**And** the generated section follows these patterns
**And** the section is optimized for ranking potential

**Given** DataForSEO SERP API returns an error
**When** SERP analysis fails
**Then** the system retries (3 attempts with exponential backoff)
**And** if retry succeeds, generation continues with SERP insights
**And** if retry fails, the section is generated without SERP data (uses keyword research only)
**And** a warning is logged: "Section generated without SERP analysis"
**And** generation continues (non-critical failure)

**Given** SERP data is available
**When** the article is being optimized
**Then** SERP insights inform:
- Overall article structure
- Keyword density targets
- Internal linking strategy
- Schema markup selection
**And** SERP data is cached for 7 days (NFR caching strategy)

**Technical Notes:**
- DataForSEO SERP API: $0.0006-0.002 per SERP, ~1 SERP per article (main keyword)
- SERP analysis used for SEO optimization (FR24)
- Caching: 7 days (SERP data changes slowly)
- Error handling: Graceful degradation (continue without SERP data)

---

### Story 4A.5: LLM Content Generation with OpenRouter Integration

**Priority:** P0 (MVP - Core value, generates article content)

As the system,
I want to generate article content using LLMs via OpenRouter,
So that I can create high-quality, SEO-optimized long-form content.

**Acceptance Criteria:**

**Given** research and SERP analysis are complete for a section
**When** the system generates section content
**Then** the system calls OpenRouter API with:
- Model selection (GPT-4, Claude, or user preference)
- Comprehensive prompt including:
  - Section topic and outline
  - Tavily research results and citations
  - SERP analysis insights
  - Keyword focus and SEO requirements
  - Writing style and tone
  - Previous section summary (for coherence)
- Token limits per section (to fit within context window)
**And** the LLM generates section content (300-800 words per section)
**And** content includes:
  - Proper heading structure (H2, H3)
  - Citations integrated naturally
  - Keyword optimization (natural density, not keyword stuffing)
  - Engaging, readable prose
  - Relevant examples and details

**Given** a section is generated
**When** content quality is checked
**Then** the system validates:
- Word count meets target (within 10% variance)
- Citations are properly formatted
- Heading structure is correct
- Keyword appears naturally (not forced)
- Readability score (Flesch-Kincaid) is calculated
**And** if quality checks fail, the section is regenerated (1 retry)
**And** quality metrics are stored with the section

**Given** OpenRouter API returns an error
**When** content generation fails
**Then** the system retries (3 attempts with exponential backoff)
**And** if retry succeeds, generation continues
**And** if retry fails, the section status is set to "failed"
**And** the article generation pauses
**And** the user is notified of the failure
**And** the user can retry the failed section

**Given** multiple sections need generation
**When** the system processes sections
**Then** sections are generated sequentially (one at a time)
**And** progress is tracked per section
**And** real-time updates are sent via websocket (Story 4A.9)
**And** API costs are tracked per section (~$0.05-0.10 per section)

**Technical Notes:**
- OpenRouter API: Routes to GPT-4, Claude, or other models
- Cost: ~$0.25-0.50 per 3,000-word article (varies by model)
- Token management: Each section fits within context window
- Coherence: Previous sections summarized for context
- Quality validation: Readability, citation count, keyword optimization

---

### Story 4A.6: Real-Time Progress Tracking and Updates

**Priority:** P0 (MVP - Users need visibility into generation progress)

As a user,
I want to see real-time progress updates during article generation,
So that I know what's happening and how long it will take.

**Acceptance Criteria:**

**Given** article generation is in progress
**When** I view the article editor page
**Then** I see a progress indicator showing:
- Current stage: "Researching...", "Writing Introduction...", "Writing Section 3 of 8...", etc.
- Overall progress: "45% complete"
- Section-by-section progress: "Section 3 of 8 (Writing... 60%)"
- Estimated time remaining: "~2 minutes remaining"
**And** progress updates appear within 1 second of state change (NFR-P3)
**And** updates are delivered via websocket (no page refresh needed)

**Given** I am viewing article generation progress
**When** a section completes
**Then** I see the completed section content appear in the editor
**And** the progress indicator updates to show the next section
**And** I can scroll to view completed sections
**And** I can edit completed sections while generation continues

**Given** I navigate away from the article editor
**When** I return later
**Then** I see the current generation status
**And** progress continues from where it left off
**And** I can see which sections are complete and which are in progress

**Given** article generation completes
**When** all sections are generated
**Then** I see a success message: "Article generation complete!"
**And** the article status changes to "draft"
**And** I can review and edit the complete article
**And** I can see generation statistics:
  - Total time: "4 minutes 32 seconds"
  - Word count: "3,247 words"
  - Citations included: "12 citations"
  - API costs: "$0.78"

**Given** websocket connection drops during generation
**When** connection is lost
**Then** I see a "Reconnecting..." indicator
**And** progress updates resume when connection is restored
**And** generation continues in the background (not paused)
**And** no progress is lost

**Technical Notes:**
- Real-time updates via Supabase websockets (NFR-P3: < 1 second latency)
- Progress tracking: Stage, percentage, section-by-section granularity
- Queue position visible if article is queued
- Graceful degradation: Generation continues even if websocket drops
- Progress state persisted in database for recovery

---

### Story 4A.7: Automatic SEO Optimization (Keyword Density, Headings, Meta Tags)

**Priority:** P1 (Post-MVP - Can be basic for MVP)

As the system,
I want to automatically optimize generated content for SEO,
So that articles rank well in search results.

**Acceptance Criteria:**

**Given** article content is generated
**When** SEO optimization is applied
**Then** the system optimizes:
- **Keyword Density:** Target keyword appears 1-2% naturally throughout content
- **Heading Structure:** Proper H1, H2, H3 hierarchy
  - H1: Article title (includes primary keyword)
  - H2: Main sections (include related keywords)
  - H3: Subsections (supporting topics)
- **Meta Tags:** Generated automatically:
  - Meta title (50-60 characters, includes keyword)
  - Meta description (150-160 characters, compelling, includes keyword)
  - Focus keyword (primary keyword)
  - Related keywords (from research)
**And** SEO score is calculated (0-100)
**And** SEO recommendations are provided if score < 70

**Given** SEO optimization is complete
**When** I view the article editor
**Then** I can see:
- SEO score displayed prominently (e.g., "SEO Score: 85/100")
- SEO checklist showing:
  - ✅ Keyword in title
  - ✅ Keyword in first paragraph
  - ✅ Proper heading structure
  - ✅ Meta tags complete
  - ⚠️ Keyword density: 1.2% (target: 1-2%)
- SEO recommendations (if any): "Consider adding keyword to H2 headings"

**Given** I want to improve SEO score
**When** I view SEO recommendations
**Then** I can click "Apply Recommendations"
**And** the system automatically adjusts:
- Keyword placement (if density too low)
- Heading structure (if needed)
- Meta tags (if incomplete)
**And** SEO score updates in real-time
**And** changes are highlighted in the editor

**Given** SEO optimization is applied
**When** the article is saved
**Then** SEO metadata is stored with the article:
- Meta title
- Meta description
- Focus keyword
- SEO score
- Optimization timestamp
**And** SEO data is used for publishing (Epic 5)

**Technical Notes:**
- SEO optimization uses SERP analysis data (from Story 4A.4)
- Keyword density: Natural placement, not keyword stuffing
- Meta tags: Generated based on content and keyword research
- SEO score: Calculated algorithm (keyword placement, heading structure, meta tags, content length)
- Real-time SEO feedback in editor

---

### Story 4A.8: Automatic FAQ Section Generation

**Priority:** P1 (Post-MVP - Nice-to-have)

As the system,
I want to automatically generate FAQ sections for articles,
So that content answers common questions and improves SEO (FAQ schema).

**Acceptance Criteria:**

**Given** article generation is complete
**When** FAQ generation is triggered
**Then** the system generates FAQ questions based on:
- Keyword research (People Also Ask data from SERP analysis)
- Related keyword suggestions
- Common questions about the topic
- Content gaps identified in competitor analysis
**And** 5-10 relevant FAQ questions are generated
**And** each FAQ includes:
  - Question (clear, natural language)
  - Answer (2-4 sentences, comprehensive)
  - Keyword optimization (includes related keywords naturally)

**Given** FAQ questions are generated
**When** I view the article editor
**Then** I see an "FAQ Section" at the end of the article
**And** FAQs are displayed in an expandable format:
  - Question (clickable, bold)
  - Answer (hidden by default, expands on click)
**And** I can:
  - Edit FAQ questions and answers
  - Add new FAQs
  - Remove FAQs
  - Reorder FAQs
**And** FAQ changes are saved with the article

**Given** FAQ section is generated
**When** schema markup is generated (Story 4A.10)
**Then** FAQ schema markup is included automatically
**And** FAQ schema follows Google's FAQPage schema format
**And** FAQs are eligible for rich snippets in search results

**Given** I don't want an FAQ section
**When** I view article generation options
**Then** I can toggle "Include FAQ Section" (default: enabled)
**And** if disabled, FAQ generation is skipped
**And** the article is generated without FAQ section

**Technical Notes:**
- FAQ generation uses:
  - People Also Ask (PAA) data from SERP analysis
  - Related keyword questions
  - Topic-specific common questions
- FAQ format: Question + Answer pairs
- FAQ schema: Google FAQPage schema for rich snippets
- FAQ placement: End of article (before conclusion)

---

### Story 4A.9: Automatic Internal Linking Suggestions

**Priority:** P1 (Post-MVP - Optimization)

As the system,
I want to automatically suggest internal links during content generation,
So that I can improve site structure and user navigation.

**Acceptance Criteria:**

**Given** article content is generated
**When** internal linking analysis is performed
**Then** the system analyzes:
- Existing articles in the content library
- Keyword relevance between current article and existing articles
- Content topic similarity
- Pillar/cluster relationships (from Epic 3 keyword clustering)
**And** 3-10 relevant internal link suggestions are generated
**And** each suggestion includes:
  - Target article title
  - Suggested anchor text
  - Relevance score (why it's relevant)
  - Suggested placement in current article (which section)

**Given** internal link suggestions are generated
**When** I view the article editor
**Then** I see a "Suggested Internal Links" panel
**And** suggestions are displayed with:
  - Target article title and excerpt
  - Suggested anchor text
  - Suggested placement (section reference)
  - "Add Link" button
**And** I can:
  - Accept suggestions (click "Add Link" to insert)
  - Reject suggestions (dismiss)
  - Edit anchor text before inserting
  - Choose different placement

**Given** I accept an internal link suggestion
**When** I click "Add Link"
**Then** the link is inserted at the suggested location
**And** anchor text is used for the link
**And** the link is formatted correctly: `[anchor text](article-url)`
**And** the suggestion is removed from the suggestions list
**And** link is saved with the article

**Given** I want to add internal links manually
**When** I select text in the article
**Then** I can click "Add Internal Link" from the editor toolbar
**And** I can search for articles to link to
**And** I can select an article and insert the link
**And** the link is formatted and saved

**Given** internal links are added
**When** the article is saved
**Then** internal link relationships are stored in the database
**And** link data is used for:
  - Site structure analysis
  - Content cluster visualization
  - Related article recommendations
**And** broken links are detected and flagged

**Technical Notes:**
- Internal linking uses keyword/topic similarity analysis
- Suggestions based on:
  - Keyword overlap
  - Topic clustering (from Epic 3)
  - Content similarity (embeddings or keyword matching)
- Link storage: `internal_links` table or `articles.links` JSONB column
- Link validation: Check target article exists and is accessible

---

### Story 4A.10: Automatic Schema Markup Generation

**Priority:** P1 (Post-MVP - Optimization)

As the system,
I want to automatically generate schema markup for articles,
So that content is eligible for rich snippets and enhanced search results.

**Acceptance Criteria:**

**Given** article content is complete
**When** schema markup is generated
**Then** the system generates appropriate schema types:
- **Article Schema** (always): Headline, author, datePublished, dateModified, image
- **FAQPage Schema** (if FAQ section exists): Questions and answers
- **HowTo Schema** (if article is a how-to guide): Steps, tools, time
- **Product Schema** (if product-focused): Product name, description, price (if available)
- **Review Schema** (if review content): Rating, review body, author
**And** schema markup follows Google's structured data guidelines
**And** schema is valid (passes Google's Rich Results Test)

**Given** schema markup is generated
**When** I view the article editor
**Then** I can see a "Schema Markup" section
**And** I can view the generated schema (JSON-LD format)
**And** I can edit schema properties if needed
**And** I can see which schema types are included
**And** schema validation status is shown (valid/invalid)

**Given** article is published (Epic 5)
**When** schema markup is included
**Then** schema is embedded in the published HTML (JSON-LD in `<script>` tag)
**And** schema is submitted to Google via Search Console (if configured)
**And** schema helps content appear in rich snippets

**Given** I want to customize schema
**When** I edit schema properties
**Then** I can modify:
  - Article author (default: organization name or user name)
  - Publication date
  - Featured image
  - Schema type selection (enable/disable specific types)
**And** changes are validated before saving
**And** invalid schema shows error messages

**Technical Notes:**
- Schema markup: JSON-LD format (recommended by Google)
- Schema types: Article (required), FAQPage, HowTo, Product, Review (conditional)
- Schema validation: Google Rich Results Test API or local validation
- Schema storage: `articles.schema_markup` JSONB column
- Schema embedding: Included in published HTML (Epic 5)

---

### Story 4A.11: Automatic Image Integration with Alt Text

**Priority:** P1 (Post-MVP - Can be manual for MVP)

As the system,
I want to automatically find and integrate relevant images with alt text,
So that articles are visually appealing and accessible.

**Acceptance Criteria:**

**Given** article content is generated
**When** image integration is triggered
**Then** the system searches for relevant images:
- **Unsplash API** (free tier): High-quality stock photos
- **DALL·E API** (if needed): AI-generated images ($0.04/image)
- Image search based on:
  - Section topics
  - Keywords
  - Content context
**And** 3-5 relevant images are selected per article
**And** images are placed at appropriate locations:
  - After introduction (hero image)
  - Within relevant sections (contextual images)
  - Before conclusion (summary image)

**Given** images are selected
**When** images are integrated
**Then** each image includes:
- **Image URL** (hosted on Cloudflare R2 or Supabase Storage)
- **Alt Text** (automatically generated based on image content and section context)
- **Caption** (optional, auto-generated or editable)
- **Attribution** (for Unsplash: photographer credit)
**And** alt text is descriptive and accessible (WCAG compliance - NFR-A1)
**And** images are optimized (compressed, appropriate dimensions)

**Given** images are integrated
**When** I view the article editor
**Then** I can see images embedded in the content
**And** I can:
  - Replace images (click image → "Replace" → search new image)
  - Edit alt text
  - Edit captions
  - Remove images
  - Reposition images (drag-and-drop)
**And** image changes are saved with the article

**Given** I want to add images manually
**When** I click "Add Image" in the editor
**Then** I can:
  - Search Unsplash for images
  - Upload my own image
  - Enter image URL
**And** uploaded images are stored in Cloudflare R2 or Supabase Storage
**And** images are optimized automatically (compression, resizing)
**And** alt text is suggested (can be edited)

**Given** images are included in the article
**When** the article is published (Epic 5)
**Then** images are included in the published content
**And** images are properly formatted for the CMS platform
**And** alt text is preserved for accessibility
**And** image URLs are accessible and optimized

**Technical Notes:**
- Image sources: Unsplash (free), DALL·E ($0.04/image if needed)
- Image storage: Cloudflare R2 or Supabase Storage
- Image optimization: Compression, resizing, format conversion (WebP)
- Alt text generation: AI-generated based on image content + section context
- Image placement: Contextual (relevant to section content)
- Cost tracking: DALL·E costs tracked, Unsplash free

---

### Epic 4B: Content Editing & Management
**User Outcome:** Users can edit generated content, manage versions, organize their content library, and perform bulk operations.

**FRs covered:** FR29-FR44

**Key Capabilities:**
- Edit generated content (add, remove, modify sections)
- Edit individual sections independently
- Request regeneration of specific sections
- Save article structures as templates
- Create custom writing styles and tones
- Duplicate articles as templates
- Save articles as drafts
- Version history and revision tracking
- Restore previous versions
- Track content changes over time
- Organize articles into folders/collections
- Search and filter content library
- Bulk selection and bulk editing operations

**Dependencies:** Epic 4A (requires article generation)

**Success Metrics:**
- 100% of articles support version history
- < 1 second search response time

### Story 4B.1: Article Editor Interface and Rich Text Editing

**Priority:** P0 (MVP - Users must be able to review/edit generated content)

As a user,
I want to edit generated article content in a rich text editor,
So that I can refine and customize content before publishing.

**Acceptance Criteria:**

**Given** I have a generated article (Epic 4A)
**When** I open the article editor
**Then** I see a split-pane layout:
- Left panel (60%): Rich text editor with article content
- Right panel (40%): Research panel, citations, SEO metrics (collapsible)
- Top bar: Save, Publish, Settings, Export buttons
- Bottom bar: Progress indicator, workflow steps
**And** the editor supports:
  - Rich text formatting (bold, italic, headings, lists, links)
  - Section editing (click section to edit)
  - Word count (real-time, bottom-right)
  - Auto-save (every 30 seconds, indicator shows "Saved" or "Saving...")
**And** I can see article metadata:
  - Title (editable)
  - Target keyword
  - Word count
  - SEO score
  - Status (draft, in-review, published)

**Given** I am editing article content
**When** I make changes to text
**Then** changes are highlighted (visual indicator)
**And** auto-save triggers after 30 seconds of inactivity
**And** I see "Saving..." indicator during save
**And** after save, I see "Saved" indicator with timestamp
**And** changes are persisted to the database

**Given** I want to format text
**When** I select text in the editor
**Then** I see a formatting toolbar with:
  - Bold, Italic, Underline
  - Heading options (H1, H2, H3)
  - Lists (ordered, unordered)
  - Link insertion
  - Image insertion
**And** formatting is applied immediately
**And** formatting is preserved when saved

**Given** I am editing a long article (3,000+ words)
**When** I scroll through the editor
**Then** sections remain accessible
**And** I can use section navigation (jump to section)
**And** editor performance remains smooth (no lag)

**Technical Notes:**
- Rich text editor: TipTap, Slate, or similar (React-based)
- Auto-save: Debounced, every 30 seconds or on blur
- Split-pane layout: Resizable panels
- Editor follows UX Design Article Editor Page specifications

---

### Story 4B.2: Section-Level Editing and Independent Section Management

**Priority:** P1 (Post-MVP - Basic editing sufficient)

As a user,
I want to edit individual sections of articles independently,
So that I can refine specific parts without affecting the rest of the article.

**Acceptance Criteria:**

**Given** I am viewing an article in the editor
**When** I view the article structure
**Then** I see sections displayed as:
- Introduction (editable section)
- H2 sections (each expandable/collapsible)
  - H3 subsections (nested under H2)
- Conclusion (editable section)
- FAQ section (editable section)
**And** each section is clearly delineated
**And** I can click a section to focus/edit it

**Given** I click on a section
**When** I want to edit it
**Then** the section becomes editable (inline editing)
**And** I can modify the section content
**And** other sections remain visible but non-editable
**And** I can save the section independently
**And** section changes are saved to the article

**Given** I want to reorganize sections
**When** I view the article structure
**Then** I can drag-and-drop sections to reorder them
**And** section order updates in real-time
**And** section order is saved with the article
**And** internal links are updated if section order changes

**Given** I want to add a new section
**When** I click "Add Section" or "Insert Section"
**Then** I can choose section type:
  - H2 section (main topic)
  - H3 subsection (under current H2)
  - Custom section
**And** I can enter section title
**And** I can write section content
**And** the new section is inserted at the selected location
**And** the section is saved with the article

**Given** I want to remove a section
**When** I select a section
**Then** I can click "Delete Section" or press Delete key
**And** I see a confirmation: "Delete this section?"
**And** if I confirm, the section is removed
**And** the article structure updates
**And** the change is saved

**Technical Notes:**
- Section-level editing: Each section stored as separate entity or marked in content
- Drag-and-drop: react-beautiful-dnd or similar
- Section structure: Maintained in article content or separate `article_sections` table
- Independent saves: Section changes trigger article update

---

### Story 4B.3: Section Regeneration and Partial Content Regeneration

**Priority:** P1 (Post-MVP - Convenience feature)

As a user,
I want to regenerate specific sections or parts of articles,
So that I can improve content quality without regenerating the entire article.

**Acceptance Criteria:**

**Given** I am editing an article
**When** I select a section (or part of a section)
**Then** I can click "Regenerate Section" from the context menu
**And** I see regeneration options:
  - Regenerate with same research (faster, uses cached research)
  - Regenerate with fresh research (slower, new Tavily + DataForSEO calls)
  - Regenerate with different style/tone
**And** I can choose regeneration parameters

**Given** I click "Regenerate Section"
**When** regeneration starts
**Then** the section shows a loading state: "Regenerating section..."
**And** progress is visible (if fresh research is selected)
**And** I can cancel regeneration if needed
**And** the original section content is preserved until regeneration completes

**Given** section regeneration completes
**When** new content is generated
**Then** I see the regenerated section content
**And** I can:
  - Accept the new content (replaces old section)
  - Reject the new content (keeps old section)
  - Edit the new content before accepting
  - Compare old vs. new (side-by-side view)
**And** if I accept, the section is updated
**And** if I reject, the original section is restored
**And** changes are saved with the article

**Given** I want to regenerate multiple sections
**When** I select multiple sections
**Then** I can click "Regenerate Selected Sections"
**And** sections are regenerated in sequence
**And** I can see progress for each section
**And** I can accept/reject each section independently
**And** API costs are tracked per regeneration

**Given** regeneration fails for a section
**When** an error occurs
**Then** I see a clear error message
**And** the original section content is preserved
**And** I can retry regeneration
**And** I can continue editing other sections

**Technical Notes:**
- Section regeneration: Uses same process as Story 4A.5 (LLM generation)
- Fresh research option: New Tavily + DataForSEO calls (additional API costs)
- Cached research option: Uses existing research data (faster, lower cost)
- Comparison view: Side-by-side diff view for old vs. new content

---

### Story 4B.4: Article Templates and Structure Saving

**Priority:** P1 (Post-MVP - Efficiency feature)

As a user,
I want to save article structures as templates for reuse,
So that I can quickly create similar articles with consistent structure.

**Acceptance Criteria:**

**Given** I have an article with a structure I like
**When** I view article settings or click "Save as Template"
**Then** I can save the article structure as a template with:
  - Template name (e.g., "Product Review Template", "How-To Guide Template")
  - Template description (optional)
  - Section structure (H2 sections, H3 subsections, FAQ inclusion)
  - Writing style/tone preferences
  - SEO optimization preferences
**And** the template is saved to my template library
**And** I can see the template in "Templates" section

**Given** I have saved templates
**When** I create a new article
**Then** I can select "Use Template" option
**And** I see a list of my saved templates
**And** I can preview template structure before selecting
**And** I can select a template to use

**Given** I select a template
**When** I start article generation
**Then** the article is generated using the template structure:
  - Same section structure (H2, H3 organization)
  - Same writing style/tone
  - Same SEO preferences
  - Content is generated for each section based on new keyword
**And** I can edit the structure after generation
**And** template structure is a starting point, not locked

**Given** I want to manage templates
**When** I view "Templates" section
**Then** I can see all my saved templates with:
  - Template name and description
  - Section count
  - Last used date
  - Quick actions: "Use Template", "Edit", "Delete", "Duplicate"
**And** I can edit template name/description
**And** I can delete templates I no longer need
**And** I can duplicate templates to create variations

**Given** I want to share templates with my team
**When** I view a template
**Then** I can mark it as "Team Template" (if I'm an organization owner)
**And** team members can see and use team templates
**And** team templates are marked with a "Team" badge

**Technical Notes:**
- Templates stored in `article_templates` table
- Template structure: JSON format storing section hierarchy and preferences
- Template sharing: Organization-level templates for team collaboration
- Template usage: Applied during article generation (Epic 4A)

---

### Story 4B.5: Custom Writing Styles and Tones

**Priority:** P1 (Post-MVP - Can use defaults)

As a user,
I want to create and use custom writing styles and tones,
So that my content matches my brand voice and audience preferences.

**Acceptance Criteria:**

**Given** I am in article settings or writing preferences
**When** I view "Writing Styles"
**Then** I can see:
  - Default styles: Professional, Conversational, Technical, Casual
  - My custom styles (if any)
  - "Create Custom Style" button
**And** each style shows a description and example

**Given** I click "Create Custom Style"
**When** I create a new writing style
**Then** I can configure:
  - Style name (e.g., "Brand Voice", "Technical Blog")
  - Description (what this style is for)
  - Tone (Formal, Friendly, Authoritative, etc.)
  - Voice characteristics (First person, Third person, etc.)
  - Example text (to guide the AI)
  - Target audience (General, B2B, B2C, etc.)
**And** I can save the custom style
**And** the style is added to my style library

**Given** I have custom writing styles
**When** I generate a new article
**Then** I can select a writing style from a dropdown
**And** selected style is applied during generation
**And** generated content matches the selected style
**And** I can change style after generation (triggers regeneration)

**Given** I am editing an article
**When** I change the writing style
**Then** I see options:
  - Regenerate entire article with new style
  - Regenerate selected sections with new style
  - Apply style to new sections only
**And** I can preview style changes before applying
**And** style changes are saved with the article

**Given** I want to manage writing styles
**When** I view "Writing Styles" section
**Then** I can:
  - Edit custom styles (modify characteristics)
  - Delete custom styles
  - Duplicate styles to create variations
  - Set default style for new articles
**And** changes are saved to my preferences

**Given** I am an organization owner
**When** I create a writing style
**Then** I can mark it as "Organization Style"
**And** all team members can use organization styles
**And** organization styles are marked with an "Org" badge

**Technical Notes:**
- Writing styles stored in `writing_styles` table
- Style configuration: JSON format storing tone, voice, audience, examples
- Style application: Included in LLM prompts during generation (Story 4A.5)
- Organization styles: Shared across team members

---

### Story 4B.6: Article Duplication and Template Creation

**Priority:** P1 (Post-MVP - Convenience feature)

As a user,
I want to duplicate articles to create similar content,
So that I can quickly create variations or use successful articles as templates.

**Acceptance Criteria:**

**Given** I have an article I want to duplicate
**When** I view the article in the article list or editor
**Then** I can click "Duplicate" or "Create Copy"
**And** I see duplication options:
  - Duplicate with content (full copy including all content)
  - Duplicate as template (structure only, no content)
  - Duplicate with new keyword (regenerate content for new keyword)
**And** I can choose duplication type

**Given** I select "Duplicate with content"
**When** I click "Duplicate"
**Then** a new article is created with:
  - Same title (with "Copy" suffix or editable)
  - Same content (all sections copied)
  - Same metadata (keyword, style, etc.)
  - Status: "Draft"
  - New article ID
**And** I can edit the duplicated article independently
**And** changes to duplicate don't affect original

**Given** I select "Duplicate as template"
**When** I click "Duplicate"
**Then** a new article is created with:
  - Same structure (sections, headings)
  - Empty content (placeholders for each section)
  - Same metadata (style, preferences)
  - Status: "Draft"
**And** I can fill in content manually or regenerate sections
**And** this is useful for creating similar articles

**Given** I select "Duplicate with new keyword"
**When** I enter a new keyword
**Then** the system:
  - Creates a new article with same structure
  - Regenerates content for the new keyword
  - Uses same writing style and preferences
  - Status: "Generating" then "Draft"
**And** I can see generation progress
**And** the new article is optimized for the new keyword

**Given** I duplicate an article
**When** the duplicate is created
**Then** I see a success message: "Article duplicated successfully"
**And** I am redirected to the new article editor
**And** the original article is unchanged
**And** both articles are independent (no linking)

**Given** I want to duplicate multiple articles
**When** I select multiple articles from the article list
**Then** I can click "Bulk Duplicate"
**And** all selected articles are duplicated
**And** I see progress for each duplication
**And** all duplicates are created with "Copy" suffix in titles

**Technical Notes:**
- Article duplication: Creates new article record with copied content/structure
- Duplication options: Full copy, template (structure only), or regenerate with new keyword
- Bulk duplication: Process multiple articles in batch
- Independent articles: No linking between original and duplicate

---

### Story 4B.7: Article Draft Saving and Auto-Save

**Priority:** P0 (MVP - Prevents data loss during editing)

As a user,
I want articles to be saved as drafts automatically,
So that I don't lose my work and can continue editing later.

**Acceptance Criteria:**

**Given** I am editing an article
**When** I make changes to content
**Then** auto-save triggers:
  - After 30 seconds of inactivity
  - When I navigate away from the editor
  - When I click "Save" manually
**And** I see "Saving..." indicator during save
**And** after save, I see "Saved" indicator with timestamp
**And** changes are persisted to the database

**Given** I am editing an article
**When** auto-save is in progress
**Then** I can continue editing (non-blocking)
**And** if I make changes during save, another save is queued
**And** I see "Saving..." indicator until save completes

**Given** I navigate away from the article editor
**When** I have unsaved changes
**Then** I see a confirmation: "You have unsaved changes. Save before leaving?"
**And** I can:
  - Save and leave
  - Leave without saving (discard changes)
  - Cancel (stay on page)
**And** if I choose to save, changes are saved before navigation

**Given** I return to an article I was editing
**When** I open the article editor
**Then** I see my last saved version
**And** I can see when it was last saved
**And** I can continue editing from where I left off
**And** if there were unsaved changes, they may be lost (depending on browser state)

**Given** I want to manually save
**When** I click "Save" or press Cmd/Ctrl + S
**Then** the article is saved immediately
**And** I see "Saved" confirmation
**And** article status remains "Draft" (unless I explicitly publish)
**And** save is synchronous (waits for confirmation)

**Given** save fails (network error, server error)
**When** auto-save or manual save fails
**Then** I see an error message: "Failed to save. Please try again."
**And** I see a "Retry" button
**And** changes are preserved in the editor (not lost)
**And** I can retry saving
**And** if retry succeeds, changes are saved

**Technical Notes:**
- Auto-save: Debounced, every 30 seconds or on blur
- Save state: Tracked in editor state and database
- Unsaved changes warning: Browser beforeunload event or React Router prompt
- Save failure: Graceful error handling with retry

---

### Story 4B.8: Version History and Revision Tracking

**Priority:** P1 (Post-MVP - Not required for MVP)

As a user,
I want to view and restore previous versions of articles,
So that I can revert changes or compare different versions.

**Acceptance Criteria:**

**Given** I am editing an article
**When** I save changes
**Then** a new version is created in version history
**And** versions are tracked with:
  - Version number (e.g., v1, v2, v3)
  - Timestamp (when saved)
  - Author (who made the change)
  - Change summary (auto-generated: "Content updated", "Section added", etc.)
  - Word count difference (if applicable)
**And** versions are stored in `article_versions` table

**Given** I want to view version history
**When** I click "Version History" in the article editor
**Then** I see a list of all versions with:
  - Version number and timestamp
  - Author name
  - Change summary
  - Word count
  - "View" and "Restore" buttons
**And** versions are sorted by most recent first
**And** I can see which version is current (marked)

**Given** I click "View" on a version
**When** I view a previous version
**Then** I see the article content as it was at that version
**And** I can see a diff view (what changed from previous version)
**And** I can compare versions side-by-side
**And** I can see added content (green), removed content (red), modified content (yellow)
**And** I can navigate between versions

**Given** I want to restore a previous version
**When** I click "Restore" on a version
**Then** I see a confirmation: "Restore this version? Current changes will be lost."
**And** if I confirm:
  - Current version is saved as a new version (preserves current state)
  - Selected version becomes the current version
  - Article content is restored to that version
  - I see "Version restored" confirmation
**And** if I cancel, no changes are made

**Given** I restore a version
**When** the restoration completes
**Then** the article editor shows the restored content
**And** I can continue editing from the restored version
**And** version history shows the restoration as a new version

**Given** I want to see what changed
**When** I compare two versions
**Then** I see a diff view showing:
  - Sections added/removed
  - Content changes (word-level diff)
  - Metadata changes (title, keyword, etc.)
**And** changes are highlighted clearly
**And** I can navigate through changes

**Technical Notes:**
- Version history: Stored in `article_versions` table
- Version creation: On every save (or significant change)
- Diff view: Uses diff algorithm (e.g., diff-match-patch) for content comparison
- Version storage: Full article content stored per version (or delta compression)
- Version limit: Keep last 50 versions (configurable)

---

### Story 4B.9: Content Change Tracking and History

**Priority:** P1 (Post-MVP - Not required)

As a user,
I want to see a history of content changes over time,
So that I can understand how articles evolved and track editing activity.

**Acceptance Criteria:**

**Given** I am viewing an article
**When** I view "Change History"
**Then** I see a timeline of changes with:
  - Date and time of each change
  - Type of change (Content edited, Section added, Section removed, Metadata updated, etc.)
  - Author (who made the change)
  - Change details (what specifically changed)
  - Version number (links to version history)
**And** changes are sorted by most recent first
**And** I can filter changes by:
  - Date range
  - Change type
  - Author
  - Section (if applicable)

**Given** I view change history
**When** I see a content change
**Then** I can click to see details:
  - What content was changed (before/after)
  - Which section was modified
  - Word count change
  - Time spent editing (if tracked)
**And** I can see a diff view of the change

**Given** I want to track editing activity
**When** changes are made to articles
**Then** the system tracks:
  - Edit sessions (start time, end time, duration)
  - Sections edited
  - Word count changes
  - Save frequency
**And** this data is available in change history
**And** I can see editing patterns over time

**Given** I am a team member
**When** I view change history
**Then** I can see changes made by all team members
**And** changes are attributed to the correct author
**And** I can filter by team member
**And** collaboration activity is visible

**Given** I want to export change history
**When** I view change history
**Then** I can click "Export History"
**And** change history is exported as CSV or PDF
**And** export includes all change details and timestamps

**Technical Notes:**
- Change tracking: Stored in `article_changes` table or `article_versions` with change metadata
- Change types: Content edit, section add/remove, metadata update, status change, etc.
- Change details: Before/after content, section references, metadata changes
- Editing activity: Tracked per edit session (start/end time, duration)

---

### Story 4B.10: Article Organization (Folders and Collections)

**Priority:** P1 (Post-MVP - Can use flat list)

As a user,
I want to organize articles into folders or collections,
So that I can manage large content libraries and group related articles.

**Acceptance Criteria:**

**Given** I am viewing my article list
**When** I want to organize articles
**Then** I can create folders/collections:
  - Click "New Folder" or "New Collection"
  - Enter folder name (e.g., "Q1 Content", "Product Reviews", "Blog Posts")
  - Optionally add description
  - Save folder
**And** folders are displayed in a folder tree or list view
**And** I can see folder article count

**Given** I have folders created
**When** I view articles
**Then** I can:
  - Drag-and-drop articles into folders
  - Select articles and choose "Move to Folder"
  - Assign articles to folders during creation
**And** articles can belong to one folder (or multiple folders if tags are used)
**And** folder assignment is saved

**Given** I view a folder
**When** I open a folder
**Then** I see all articles in that folder
**And** I can see folder metadata:
  - Article count
  - Total word count
  - Last updated date
  - Folder description
**And** I can manage folder:
  - Rename folder
  - Delete folder (articles remain, just removed from folder)
  - Add/remove articles

**Given** I want to organize by multiple criteria
**When** I view organization options
**Then** I can use:
  - Folders (hierarchical organization)
  - Tags (multiple tags per article)
  - Projects (Epic 8 - for agencies)
**And** I can combine these (e.g., articles in "Q1 Content" folder with "Product Review" tag)
**And** filtering works across folders, tags, and projects

**Given** I am an agency user
**When** I organize articles
**Then** I can organize by:
  - Client (each client has their own folder/project)
  - Content type (Blog, Product Descriptions, etc.)
  - Campaign or initiative
**And** organization supports multi-client workflows
**And** client-specific organization is visible only to relevant team members

**Technical Notes:**
- Folders/Collections: Stored in `article_folders` or `collections` table
- Article-folder relationship: Many-to-one or many-to-many (if tags used)
- Folder hierarchy: Support nested folders (optional)
- Organization: Folders, tags, projects (Epic 8) work together

---

### Story 4B.11: Content Library Search and Filtering

**Priority:** P1 (Post-MVP - Can use basic filtering)

As a user,
I want to search and filter my content library,
So that I can quickly find specific articles among many.

**Acceptance Criteria:**

**Given** I am viewing my article list
**When** I use the search bar
**Then** I can search by:
  - Article title
  - Article content (full-text search)
  - Keyword
  - Author
  - Status
**And** search results update as I type (debounced, 300ms)
**And** matching text is highlighted in results
**And** I can see result count: "Found 15 articles matching 'running shoes'"

**Given** I want to filter articles
**When** I view filter options
**Then** I can filter by:
  - Status (Draft, In Progress, Published, Indexed, Failed)
  - Date range (Created date, Last modified date)
  - Folder/Collection
  - Tags (if implemented)
  - Author (for team articles)
  - Client (for agency users)
  - Project (for agencies)
  - Word count range
  - SEO score range
**And** filters can be combined (AND logic)
**And** active filters are shown as badges
**And** I can clear individual filters or clear all

**Given** I have filtered results
**When** I view the article list
**Then** I see only articles matching all active filters
**And** I can see filter result count: "Showing 25 of 150 articles"
**And** I can save filter combinations as "Saved Filters"
**And** saved filters are accessible from a dropdown

**Given** I want to sort articles
**When** I view sort options
**Then** I can sort by:
  - Date created (newest/oldest)
  - Last modified (newest/oldest)
  - Title (A-Z, Z-A)
  - Word count (highest/lowest)
  - SEO score (highest/lowest)
  - Status
**And** sorting is applied immediately
**And** sort order is preserved when navigating

**Given** I have many articles (100+)
**When** I view the article list
**Then** results are paginated (10, 25, 50, 100 per page)
**And** I can navigate between pages
**And** filters, sorting, and search are preserved across pages
**And** I see pagination info: "Showing 1-25 of 150 articles"

**Technical Notes:**
- Full-text search: PostgreSQL tsvector/tsquery or Supabase full-text search
- Filtering: Client-side for small result sets, server-side for large sets
- Saved filters: Stored in `user_preferences` or `saved_filters` table
- Search/filter state: Persisted in URL query parameters for shareability

---

### Story 4B.12: Bulk Article Selection and Operations

**Priority:** P1 (Post-MVP - Efficiency, not required)

As a user,
I want to select multiple articles and perform bulk operations,
So that I can manage many articles efficiently.

**Acceptance Criteria:**

**Given** I am viewing my article list
**When** I want to select articles
**Then** I can:
  - Click checkboxes to select individual articles
  - Click "Select All" to select all visible articles
  - Use keyboard shortcuts (Cmd/Ctrl + A to select all)
**And** selected articles are highlighted
**And** I can see selection count: "5 articles selected"
**And** a bulk actions bar appears at the top/bottom with available actions

**Given** I have selected multiple articles
**When** I view bulk actions
**Then** I can perform:
  - **Move to Folder:** Move selected articles to a folder
  - **Change Status:** Update status (e.g., move to "Draft", "Published")
  - **Assign to Team Member:** Assign articles (for team workflows)
  - **Add Tags:** Add tags to selected articles
  - **Delete:** Delete selected articles (with confirmation)
  - **Export:** Export selected articles (CSV, JSON, PDF)
  - **Duplicate:** Duplicate selected articles
**And** bulk actions are clearly labeled
**And** I can see how many articles will be affected

**Given** I perform a bulk operation
**When** I click a bulk action (e.g., "Move to Folder")
**Then** I see a confirmation or action dialog:
  - For "Move to Folder": Folder selection dropdown
  - For "Delete": Confirmation with article count
  - For "Change Status": Status selection dropdown
**And** I can confirm or cancel the operation
**And** if I confirm, the operation is applied to all selected articles

**Given** a bulk operation is in progress
**When** articles are being processed
**Then** I see progress:
  - "Processing 3 of 10 articles..."
  - Success count and failure count
  - Individual article results (if some fail)
**And** I can cancel the operation if needed
**And** completed operations are preserved even if I cancel

**Given** a bulk operation completes
**When** all articles are processed
**Then** I see a summary:
  - "Successfully moved 8 articles to folder 'Q1 Content'"
  - "2 articles failed (insufficient permissions)"
  - List of failed articles with reasons
**And** I can retry failed operations
**And** the article list updates to reflect changes

**Given** I want to select articles across pages
**When** I have paginated results
**Then** "Select All" selects only visible articles (current page)
**And** I can select "Select All Across Pages" to select all matching articles
**And** bulk operations apply to all selected articles across pages

**Technical Notes:**
- Bulk selection: Checkbox selection with "Select All" functionality
- Bulk operations: Processed via Inngest workers for large batches (async)
- Progress tracking: Real-time updates via websockets
- Error handling: Individual article failures don't stop the batch

---

### Story 4B.13: Bulk Editing Operations

**Priority:** P1 (Post-MVP - Efficiency, not required)

As a user,
I want to perform bulk editing on multiple articles,
So that I can update metadata, tags, or other properties across many articles at once.

**Acceptance Criteria:**

**Given** I have selected multiple articles
**When** I click "Bulk Edit"
**Then** I see a bulk edit modal with editable fields:
  - Status (change status for all selected)
  - Tags (add/remove tags for all selected)
  - Folder/Collection (move all to folder)
  - Author/Owner (reassign articles)
  - Client (for agencies, assign to client)
  - Project (assign to project)
  - Custom fields (if applicable)
**And** I can edit multiple fields at once
**And** I can see which articles will be affected

**Given** I make bulk edits
**When** I click "Apply Changes"
**Then** I see a confirmation: "Apply these changes to 10 articles?"
**And** I can review the changes before applying
**And** if I confirm:
  - Changes are applied to all selected articles
  - Progress is shown for each article
  - Success/failure count is displayed
**And** if I cancel, no changes are made

**Given** I want to bulk update metadata
**When** I select articles and click "Bulk Edit"
**Then** I can update:
  - Writing style (apply style to all selected)
  - SEO focus keyword (if articles share similar topics)
  - Publishing settings (default status, categories)
  - Custom metadata fields
**And** changes are applied consistently across selected articles
**And** I can preview changes before applying

**Given** bulk editing completes
**When** changes are applied
**Then** I see a summary:
  - "Successfully updated 8 articles"
  - "2 articles failed (permission denied)"
  - List of updated articles
**And** the article list refreshes to show changes
**And** I can see what changed in change history (if tracked)

**Given** I want to bulk edit content
**When** I select articles with similar structure
**Then** I can perform content-level bulk edits:
  - Find and replace text across articles
  - Update section headings
  - Add/remove sections
  - Update citations or links
**And** I see a preview of changes before applying
**And** changes are applied carefully (with validation)

**Technical Notes:**
- Bulk editing: Processed via Inngest workers for large batches
- Field updates: Atomic updates per article (transaction safety)
- Preview: Show changes before applying (safety)
- Validation: Ensure bulk edits don't break article structure or data integrity

---

### Epic 5: Publishing & Distribution
**User Outcome:** Users can publish articles to CMS platforms, schedule publishing, track indexing status, and export content in multiple formats.

**FRs covered:** FR57-FR68

**Key Capabilities:**
- One-click publishing to WordPress
- Automatic Google Search Console indexing
- Track indexing status (indexed, pending, failed)
- Generate social media posts (Twitter, LinkedIn, Facebook)
- View publishing history and status
- Bulk publishing (multiple articles to multiple destinations)
- Configure publishing settings per CMS connection
- Export articles (HTML, Markdown, PDF, DOCX)
- Schedule publishing for future dates
- Timezone conversions for scheduled publishing
- Validate CMS connection credentials
- Automatic OAuth token refresh

**Dependencies:** Epic 4B (requires articles to publish)

**Success Metrics:**
- 99%+ CMS publishing success rate (NFR-I1)
- < 10 seconds publishing time (NFR-P1 breakdown)
- 100% successful OAuth token refresh (NFR-I3)

### Story 5.1: CMS Connection Management and Credential Storage

**Priority:** P0 (MVP - Users must connect WordPress to publish articles)

As a user,
I want to connect my CMS platforms and store credentials securely,
So that I can publish articles to my websites.

**Acceptance Criteria:**

**Given** I am in Settings > Integrations > CMS Connections
**When** I want to add a CMS connection
**Then** I see a list of supported CMS platforms:
  - WordPress
  - Shopify
  - Webflow
  - Ghost
  - Wix
  - Squarespace
  - Blogger
  - Custom Webhook
**And** each platform shows connection method (API Key, OAuth, etc.)
**And** I can click "Connect" for any platform

**Given** I click "Connect" for WordPress
**When** I configure WordPress connection
**Then** I can enter:
  - Site URL (e.g., https://mysite.com)
  - Username
  - Application Password (WordPress Application Password)
**And** I can test the connection before saving
**And** if connection test succeeds, credentials are saved
**And** if connection test fails, I see a clear error message with troubleshooting steps
**And** credentials are encrypted at rest (AES-256) - NFR-S6

**Given** I click "Connect" for Shopify (OAuth platform)
**When** I configure Shopify connection
**Then** I am redirected to Shopify OAuth flow
**And** I authorize the app in Shopify
**And** I am redirected back to Infin8Content
**And** OAuth tokens are stored (encrypted)
**And** connection is established
**And** I can see connected store name and URL

**Given** I have connected CMS platforms
**When** I view CMS Connections
**Then** I see all connected platforms with:
  - Platform name and icon
  - Site URL/name
  - Connection status (Connected, Error, Expired)
  - Last used date
  - Quick actions: "Test Connection", "Edit", "Disconnect"
**And** I can manage connections (edit, disconnect, reconnect)

**Given** I want to validate a connection
**When** I click "Test Connection"
**Then** the system validates credentials (Story 5.2)
**And** I see connection status: "Connected" or error message
**And** if connection fails, I see actionable error message
**And** I can update credentials if needed

**Technical Notes:**
- Credential storage: Encrypted at rest (AES-256), decrypted only in worker memory (NFR-S6)
- OAuth tokens: Stored encrypted, refreshed automatically (Story 5.8)
- Connection validation: Test API call before saving credentials
- Platform-specific adapters: WordPressAdapter, ShopifyAdapter, etc. (Architecture pattern)

---

### Story 5.2: CMS Connection Credential Validation

**Priority:** P0 (MVP - Prevents publishing failures)

As the system,
I want to validate CMS connection credentials before publishing,
So that I can prevent publishing failures and provide clear error messages.

**Acceptance Criteria:**

**Given** a user enters CMS credentials
**When** they click "Test Connection" or "Save Connection"
**Then** the system makes a test API call to the CMS platform:
  - WordPress: GET /wp-json/wp/v2/users/me (verify authentication)
  - Shopify: GET /admin/api/2024-01/shop.json (verify OAuth token)
  - Webflow: GET /sites (verify API token)
  - Ghost: GET /ghost/api/admin/site (verify Admin API key)
  - Other platforms: Platform-specific validation endpoint
**And** if validation succeeds:
  - Connection status is set to "Connected"
  - Credentials are saved (encrypted)
  - Success message: "Connection successful!"
**And** if validation fails:
  - Connection status is set to "Error"
  - Credentials are NOT saved
  - Clear error message shown: "Connection failed: [specific reason]"
  - Troubleshooting steps provided

**Given** credentials are validated
**When** validation succeeds
**Then** connection metadata is stored:
  - Platform type
  - Site URL/name
  - Connection method (API Key, OAuth)
  - Validation timestamp
  - Connection status
**And** connection is ready for publishing

**Given** credentials fail validation
**When** validation error occurs
**Then** error messages are specific:
  - "Invalid API key" (for API key platforms)
  - "OAuth token expired" (for OAuth platforms)
  - "Site not found" (for invalid URLs)
  - "Permission denied" (for insufficient permissions)
**And** I can retry validation after fixing credentials
**And** validation can be triggered manually or automatically before publishing

**Given** I have an existing connection
**When** I try to publish (Story 5.3)
**Then** credentials are validated automatically before publishing
**And** if validation fails, publishing is blocked
**And** I see: "Connection error. Please update your [Platform] credentials."
**And** I can update credentials and retry

**Technical Notes:**
- Validation: Test API call before saving or using credentials
- Error handling: Specific error messages for different failure types
- Automatic validation: Before publishing operations
- Credential refresh: OAuth tokens validated and refreshed if needed (Story 5.8)

---

### Story 5.3: WordPress Publishing (One-Click Publish)

**Priority:** P0 (MVP - Core value, publishes articles to WordPress)

As a user,
I want to publish articles to WordPress with one click,
So that I can quickly publish content to my website.

**Acceptance Criteria:**

**Given** I have an article ready to publish (Epic 4B)
**When** I click "Publish" in the article editor
**Then** I see publishing options:
  - Select CMS platform (if multiple connected)
  - Publish status: "Draft" or "Publish" (live)
  - Category selection (WordPress categories)
  - Tags (WordPress tags)
  - Featured image (if available)
  - Author (if multiple authors on WordPress)
**And** I can configure publishing settings (Story 5.6)
**And** I can click "Publish Now" to proceed

**Given** I click "Publish Now" for WordPress
**When** publishing starts
**Then** the article is queued for publishing via Inngest worker
**And** I see publishing status: "Publishing to WordPress..."
**And** progress is tracked in real-time (via websocket)
**And** article status changes to "Publishing"

**Given** WordPress publishing completes successfully
**When** the article is published
**Then** I see success message: "Article published to WordPress!"
**And** I see the published URL (clickable link)
**And** article status changes to "Published"
**And** publishing record is created in publishing history (Story 5.7)
**And** Google Search Console indexing is triggered (Story 5.4)
**And** I can click the URL to view the published article

**Given** WordPress publishing fails
**When** an error occurs
**Then** I see a clear error message:
  - "Publishing failed: [specific reason]"
  - "Connection error" (if credentials invalid)
  - "Permission denied" (if insufficient permissions)
  - "Site not found" (if WordPress site unreachable)
**And** I see a "Retry" button
**And** article status remains "Draft" or "Failed"
**And** I can update credentials and retry

**Given** I publish to WordPress
**When** the article is published
**Then** the following are included:
  - Article title (as WordPress post title)
  - Article content (HTML format, properly formatted)
  - Meta description (from SEO optimization - Epic 4A)
  - Featured image (if available)
  - Categories and tags (as configured)
  - Author (if specified)
  - Schema markup (embedded in content)
**And** content is properly formatted for WordPress
**And** images are uploaded to WordPress media library (if needed)

**Technical Notes:**
- WordPress REST API: POST /wp-json/wp/v2/posts
- Publishing via Inngest worker (async, queue-based)
- Real-time progress updates via websockets
- Error handling: 3 retry attempts with exponential backoff
- Content formatting: HTML conversion, image handling, schema embedding

---

### Story 5.4: Google Search Console Indexing Integration

**Priority:** P0 (MVP - Core value, submits URLs for indexing, part of North Star Metric)

As the system,
I want to automatically submit published URLs to Google Search Console for indexing,
So that articles are indexed quickly and appear in search results.

**Acceptance Criteria:**

**Given** an article is successfully published to a CMS (Story 5.3)
**When** publishing completes
**Then** the system automatically:
  - Extracts the published URL from the CMS response
  - Submits URL to Google Search Console API for indexing
  - Creates an indexing request record
  - Sets article indexing status to "Pending"
**And** indexing submission happens automatically (no user action required)
**And** submission is queued via Inngest worker (async)

**Given** a URL is submitted to Google Search Console
**When** submission is processed
**Then** the system stores:
  - Submitted URL
  - Submission timestamp
  - Submission status (Submitted, Indexed, Failed)
  - Google Search Console request ID (if available)
**And** indexing status is tracked in the article record

**Given** Google Search Console API returns an error
**When** submission fails
**Then** the system retries (3 attempts with exponential backoff)
**And** if retry succeeds, submission is recorded
**And** if retry fails, indexing status is set to "Failed"
**And** error is logged for monitoring
**And** user is notified (optional, non-critical failure)

**Given** I have connected Google Search Console
**When** I view article indexing status
**Then** I can see:
  - Indexing status: "Pending", "Indexed", "Failed"
  - Submission date
  - Last checked date
  - Google Search Console URL (if indexed)
**And** I can manually trigger re-submission if needed

**Given** Google Search Console is not connected
**When** an article is published
**Then** indexing submission is skipped (graceful degradation)
**And** article status shows "Published (Indexing not configured)"
**And** I can connect Google Search Console later
**And** I can manually submit URLs after connecting

**Technical Notes:**
- Google Search Console API: URL Inspection API or Indexing API
- OAuth required: Google OAuth flow for Search Console access
- Automatic submission: Triggered after successful CMS publishing
- Indexing status tracking: Stored in `article_indexing_status` table
- Graceful degradation: Non-critical, can publish without Search Console

---

### Story 5.5: Indexing Status Tracking and Monitoring

**Priority:** P0 (MVP - Users need to see indexing confirmation)

As a user,
I want to track the indexing status of my published articles,
So that I know when articles are indexed and appear in search results.

**Acceptance Criteria:**

**Given** an article URL is submitted to Google Search Console (Story 5.4)
**When** I view the article in the article list or editor
**Then** I can see indexing status with:
  - Status badge: "Pending" (yellow), "Indexed" (green), "Failed" (red)
  - Submission date
  - Last checked date
  - Google Search Console link (if indexed)
**And** status is updated automatically (polling or webhook)

**Given** I want to check indexing status
**When** I view "Indexing Status" in article details
**Then** I can see:
  - Current status and timestamp
  - Submission history (if multiple submissions)
  - Google Search Console data (if available):
    - Index status (Indexed, Not Indexed)
    - Last crawl date
    - Coverage status
    - Any indexing errors
**And** I can manually trigger status check
**And** status check queries Google Search Console API

**Given** indexing status changes
**When** an article becomes indexed
**Then** I see a notification: "Article '[Title]' has been indexed by Google"
**And** article status updates to "Indexed"
**And** I can see indexing date
**And** notification appears in activity feed (Epic 2)

**Given** indexing fails or is rejected
**When** Google Search Console reports an error
**Then** I see indexing status: "Failed" or "Not Indexed"
**And** I can see error details:
  - "Duplicate content" (if applicable)
  - "Crawl error" (if applicable)
  - "Robots.txt blocked" (if applicable)
  - Other Google-specific errors
**And** I can see recommendations for fixing the issue
**And** I can resubmit the URL after fixing issues

**Given** I want to monitor indexing across articles
**When** I view "Indexing Dashboard" or filter articles by indexing status
**Then** I can see:
  - Total articles submitted
  - Articles indexed (count and percentage)
  - Articles pending (count)
  - Articles failed (count)
  - Average time to index
**And** I can filter articles by indexing status
**And** I can see trends over time (indexing rate, success rate)

**Technical Notes:**
- Indexing status: Polled from Google Search Console API (daily or on-demand)
- Status tracking: Stored in `article_indexing_status` table
- Notifications: Via websocket or email (optional)
- Monitoring: Dashboard view for indexing metrics

---

### Story 5.6: Publishing Settings Configuration Per CMS

**Priority:** P1 (Post-MVP - Can use defaults)

As a user,
I want to configure publishing settings per CMS connection,
So that articles are published with the correct categories, tags, and defaults.

**Acceptance Criteria:**

**Given** I have a CMS connection (Story 5.1)
**When** I view CMS connection settings
**Then** I can configure publishing defaults:
  - **Default Status:** Draft, Publish, Scheduled
  - **Default Category:** (WordPress) Select default category
  - **Default Tags:** (WordPress) Comma-separated tags
  - **Default Author:** (WordPress) Select default author
  - **Featured Image:** Always include, Never include, Ask each time
  - **Schema Markup:** Include, Don't include
  - **Auto-index:** Submit to Google Search Console automatically
**And** settings are saved per CMS connection
**And** settings are applied as defaults when publishing

**Given** I configure publishing settings
**When** I publish an article
**Then** default settings are pre-filled in the publishing dialog
**And** I can override defaults for individual articles
**And** overrides don't change the default settings
**And** settings are applied if I don't override them

**Given** I have multiple CMS connections
**When** I configure publishing settings
**Then** each CMS connection has its own settings
**And** settings are platform-specific:
  - WordPress: Categories, tags, author, featured image
  - Shopify: Blog collection, tags, metafields
  - Webflow: Collection, fields mapping
  - Ghost: Tags, authors, featured image
**And** I can see which settings apply to which platform

**Given** I want to use different settings for different content types
**When** I configure publishing settings
**Then** I can create publishing presets:
  - "Blog Posts" preset: Category "Blog", tags "SEO, Content"
  - "Product Reviews" preset: Category "Reviews", tags "Products"
  - "How-To Guides" preset: Category "Guides", tags "Tutorial"
**And** I can select a preset when publishing
**And** presets apply the configured settings

**Given** I update publishing settings
**When** I save changes
**Then** new settings apply to future publishing operations
**And** existing published articles are not affected
**And** I see a confirmation: "Publishing settings updated"

**Technical Notes:**
- Publishing settings: Stored in `cms_connections.publishing_settings` JSONB column
- Platform-specific settings: Different fields per CMS platform
- Presets: Optional, stored as named configuration sets
- Default application: Settings applied unless overridden per article

---

### Story 5.7: Publishing History and Status Tracking

**Priority:** P1 (Post-MVP - Basic confirmation sufficient)

As a user,
I want to view publishing history and status for all articles,
So that I can track what was published, when, and where.

**Acceptance Criteria:**

**Given** articles are published to CMS platforms
**When** I view "Publishing History"
**Then** I see a list of all publishing operations with:
  - Article title
  - CMS platform and site name
  - Published URL (clickable link)
  - Publish status (Success, Failed, Pending)
  - Publish date and time
  - Indexing status (if applicable)
  - Author (who published)
**And** history is sorted by most recent first
**And** I can filter by:
  - CMS platform
  - Publish status
  - Date range
  - Article title

**Given** I view publishing history
**When** I click on a publishing record
**Then** I can see publishing details:
  - Full article title and content preview
  - CMS platform and connection details
  - Published URL and live link
  - Publishing settings used (categories, tags, etc.)
  - Publishing duration (how long it took)
  - Any errors or warnings
  - Indexing status and submission details

**Given** a publishing operation fails
**When** I view publishing history
**Then** failed operations are marked with "Failed" status
**And** I can see error details:
  - Error message
  - Error timestamp
  - Retry attempts made
  - Last error reason
**And** I can retry failed publishing operations
**And** I can see what went wrong and how to fix it

**Given** I want to see publishing status for a specific article
**When** I view an article in the editor
**Then** I can see publishing status section with:
  - All publishing attempts for this article
  - Current published status (if published)
  - Published URLs (if multiple platforms)
  - Last published date
  - Indexing status for each published URL
**And** I can see publishing history specific to this article

**Given** I want to republish an article
**When** I view publishing history
**Then** I can click "Republish" on a previous publishing record
**And** the article is republished to the same CMS platform
**And** a new publishing record is created
**And** I can update publishing settings before republishing

**Technical Notes:**
- Publishing history: Stored in `publishing_history` table
- Status tracking: Success, Failed, Pending, Cancelled
- History includes: Article ID, CMS connection ID, URL, status, timestamps, error details
- Republishing: Creates new history record, doesn't modify existing records

---

### Story 5.8: OAuth Token Refresh Automation

**Priority:** P1 (Post-MVP - Can be manual for MVP)

As the system,
I want to automatically refresh expired OAuth tokens before they expire,
So that CMS connections remain functional without manual intervention.

**Acceptance Criteria:**

**Given** I have OAuth-based CMS connections (Shopify, Wix, Blogger)
**When** OAuth tokens are stored
**Then** the system tracks token expiration dates
**And** tokens are stored encrypted (AES-256)
**And** expiration dates are stored with tokens

**Given** an OAuth token is approaching expiration
**When** the token is within 1 hour of expiration (NFR-I3)
**Then** the system automatically refreshes the token:
  - Calls the OAuth provider's refresh endpoint
  - Receives new access token and refresh token
  - Updates stored tokens (encrypted)
  - Updates expiration date
  - Logs refresh success
**And** refresh happens in the background (via Inngest scheduled job)
**And** user is not interrupted
**And** connection remains functional

**Given** token refresh succeeds
**When** new tokens are received
**Then** old tokens are invalidated
**And** new tokens are stored (encrypted)
**And** connection status remains "Connected"
**And** refresh is logged in connection history
**And** publishing operations continue without interruption

**Given** token refresh fails
**When** refresh attempt fails
**Then** the system retries (3 attempts with exponential backoff)
**And** if retry succeeds, tokens are updated
**And** if retry fails:
  - Connection status is set to "Error"
  - User is notified: "Your [Platform] connection needs reauthorization"
  - Publishing to that platform is blocked until reauthorization
  - User can click "Reauthorize" to start OAuth flow again

**Given** I want to check token status
**When** I view CMS connection settings
**Then** I can see:
  - Token status: "Valid", "Expiring Soon" (within 24 hours), "Expired"
  - Last refreshed date
  - Next refresh date (estimated)
  - Refresh history (last 5 refreshes)
**And** I can manually trigger token refresh if needed

**Technical Notes:**
- OAuth token refresh: Automatic, 1 hour before expiration (NFR-I3)
- Scheduled job: Inngest cron job checks token expiration daily
- Token storage: Encrypted at rest, decrypted only in worker memory
- Refresh success rate: 100% target (NFR-I3)
- Error handling: Retry logic, user notification on failure

---

### Story 5.9: Scheduled Publishing with Timezone Support

**Priority:** P1 (Post-MVP - Not required)

As a user,
I want to schedule articles for future publishing dates,
So that I can plan content releases and publish at optimal times.

**Acceptance Criteria:**

**Given** I am ready to publish an article
**When** I click "Publish" in the article editor
**Then** I can select "Schedule" instead of "Publish Now"
**And** I can set:
  - Publish date (calendar picker)
  - Publish time (time picker)
  - Timezone (defaults to my account timezone, can be changed)
**And** I can see the scheduled time in my local timezone
**And** I can see the scheduled time in the CMS platform's timezone (if different)

**Given** I schedule an article for future publishing
**When** I save the schedule
**Then** the article is queued for scheduled publishing
**And** article status changes to "Scheduled"
**And** I see scheduled date and time
**And** I can see countdown: "Publishing in 2 days, 5 hours"
**And** scheduled publishing is handled by Inngest scheduled job

**Given** a scheduled article reaches its publish time
**When** the scheduled time arrives
**Then** Inngest worker triggers publishing automatically
**And** article is published to the selected CMS platform
**And** publishing follows the same process as immediate publishing (Story 5.3)
**And** article status changes to "Published"
**And** I receive a notification: "Article '[Title]' has been published"

**Given** I schedule an article in a different timezone
**When** I set publish time
**Then** the system converts time to UTC for scheduling
**And** the system converts time to CMS platform's timezone for publishing
**And** I can see the time in multiple timezones (my timezone, CMS timezone, UTC)
**And** timezone conversions are accurate (handles DST correctly)

**Given** I want to manage scheduled articles
**When** I view "Scheduled Articles" or filter by "Scheduled" status
**Then** I see all scheduled articles with:
  - Article title
  - Scheduled date and time
  - CMS platform
  - Time remaining until publish
  - Quick actions: "Edit Schedule", "Publish Now", "Cancel"
**And** I can edit the schedule (change date/time)
**And** I can publish immediately (cancel schedule, publish now)
**And** I can cancel the schedule (article returns to "Draft" status)

**Given** I cancel a scheduled article
**When** I click "Cancel Schedule"
**Then** the scheduled publishing job is cancelled
**And** article status returns to "Draft"
**And** I see confirmation: "Schedule cancelled"
**And** article is removed from scheduled queue

**Technical Notes:**
- Scheduled publishing: Inngest scheduled jobs (cron-based)
- Timezone handling: UTC storage, conversion to user/CMS timezones
- DST handling: Proper timezone conversion with DST awareness
- Schedule management: Edit, cancel, publish now options
- Timezone display: Show time in multiple timezones for clarity

---

### Story 5.10: Bulk Publishing Operations

**Priority:** P1 (Post-MVP - Efficiency, not required)

As a user,
I want to publish multiple articles to multiple destinations in one operation,
So that I can efficiently distribute content across platforms.

**Acceptance Criteria:**

**Given** I have multiple articles ready to publish
**When** I select multiple articles from the article list (Epic 4B.12)
**Then** I can click "Bulk Publish" from bulk actions
**And** I see bulk publishing options:
  - Select CMS platforms (can select multiple)
  - Publish status (Draft, Publish, Scheduled)
  - Publishing settings (categories, tags, etc.)
  - Schedule time (if scheduling)
**And** I can configure bulk publishing settings

**Given** I configure bulk publishing and click "Publish All"
**When** bulk publishing starts
**Then** articles are queued for publishing
**And** I see bulk publishing progress:
  - Total articles: 10
  - Publishing to: WordPress (5), Shopify (5)
  - Completed: 3
  - In Progress: 2
  - Remaining: 5
  - Failed: 0
**And** progress updates in real-time via websocket
**And** I can see individual article status in the progress view

**Given** bulk publishing is in progress
**When** some articles publish successfully and others fail
**Then** I see:
  - Success count: "8 articles published successfully"
  - Failure count: "2 articles failed"
  - List of failed articles with error reasons
**And** successful publications are completed
**And** failed publications can be retried individually
**And** I can retry all failed publications with one click

**Given** I want to publish to multiple platforms
**When** I select multiple CMS platforms in bulk publish
**Then** each article is published to all selected platforms
**And** publishing happens in parallel (up to 5 concurrent per platform)
**And** I can see progress per platform
**And** each platform's publishing status is tracked separately

**Given** bulk publishing completes
**When** all articles are processed
**Then** I see a summary:
  - Total articles: 10
  - Successfully published: 8
  - Failed: 2
  - Total platforms: 2 (WordPress, Shopify)
  - Total time: "2 minutes 15 seconds"
**And** I can:
  - View publishing history for all articles
  - Retry failed publications
  - Export publishing report (CSV, PDF)
**And** all publishing records are created in publishing history

**Given** I want to cancel bulk publishing
**When** bulk publishing is in progress
**Then** I can click "Cancel Bulk Publish"
**And** in-progress publications complete (not cancelled mid-operation)
**And** queued publications are cancelled
**And** I see: "Bulk publishing cancelled. 3 articles published, 7 cancelled."

**Technical Notes:**
- Bulk publishing: Processed via Inngest workers (queue-based)
- Parallel processing: Up to 5 concurrent publications per platform
- Progress tracking: Real-time updates via websockets
- Error handling: Individual article failures don't stop the batch
- Cancellation: Graceful cancellation (in-progress completes, queued cancels)

---

### Story 5.11: Social Media Post Generation

**Priority:** P1 (Post-MVP - Not core value)

As a user,
I want to generate social media posts from articles,
So that I can promote my content on Twitter, LinkedIn, and Facebook.

**Acceptance Criteria:**

**Given** I have a published or draft article
**When** I view the article editor or click "Generate Social Posts"
**Then** I can generate social media posts for:
  - Twitter (280 characters, with hashtags)
  - LinkedIn (longer format, professional tone)
  - Facebook (engaging format, can include images)
**And** I can select which platforms to generate for
**And** I can click "Generate Posts" to create posts

**Given** I click "Generate Posts"
**When** posts are generated
**Then** the system creates platform-specific posts:
  - **Twitter:** 
    - 280-character limit
    - Includes article title, key points, link
    - Relevant hashtags (3-5)
    - Engaging hook
  - **LinkedIn:**
    - Longer format (up to 3,000 characters)
    - Professional tone
    - Article summary and key insights
    - Call-to-action
    - Link to article
  - **Facebook:**
    - Engaging, conversational tone
    - Article summary
    - Question or hook to drive engagement
    - Link to article
    - Optional: Featured image
**And** posts are generated using LLM (OpenRouter) with article content as context
**And** posts are displayed in a preview format

**Given** social media posts are generated
**When** I view the posts
**Then** I can:
  - Edit each post (customize text, hashtags, etc.)
  - Copy post text (for manual posting)
  - Schedule posts (if social media integration exists - future feature)
  - Regenerate posts (if not satisfied)
**And** posts are saved with the article
**And** I can regenerate posts later

**Given** I want to customize social posts
**When** I edit a generated post
**Then** I can modify:
  - Post text
  - Hashtags
  - Link placement
  - Tone/style
**And** changes are saved
**And** I can preview how the post will look on each platform

**Given** I have generated social posts
**When** I view the article
**Then** I can see a "Social Media Posts" section
**And** I can access generated posts
**And** I can regenerate posts if article content changes
**And** posts are updated if I regenerate them

**Technical Notes:**
- Social post generation: Uses LLM (OpenRouter) with article content as context
- Platform-specific formats: Different character limits, tones, and structures
- Post storage: Saved in `article_social_posts` table or `articles.social_posts` JSONB column
- Future integration: Social media API integration for direct posting (Phase 2)

---

### Story 5.12: Article Export in Multiple Formats

**Priority:** P1 (Post-MVP - Not required)

As a user,
I want to export articles in multiple formats,
So that I can use content in different tools or share it in various formats.

**Acceptance Criteria:**

**Given** I have an article ready
**When** I click "Export" in the article editor
**Then** I can select export format:
  - HTML (formatted HTML with styles)
  - Markdown (Markdown format)
  - PDF (formatted PDF document)
  - DOCX (Microsoft Word document)
**And** I can select what to include:
  - Full article content
  - Article metadata (title, keyword, author, date)
  - Citations and references
  - Images (embedded or as attachments)
  - SEO metadata
**And** I can click "Export" to generate the file

**Given** I select "Export as HTML"
**When** export is generated
**Then** I receive an HTML file with:
  - Properly formatted HTML structure
  - Embedded styles (or reference to stylesheet)
  - Images embedded (base64) or as separate files
  - Proper heading structure (H1, H2, H3)
  - Links preserved
  - Citations formatted
**And** the HTML file is downloadable
**And** the file can be opened in any browser or HTML editor

**Given** I select "Export as Markdown"
**When** export is generated
**Then** I receive a Markdown file with:
  - Proper Markdown syntax
  - Headings (#, ##, ###)
  - Lists, links, images in Markdown format
  - Code blocks (if any)
  - Citations in Markdown format
**And** the Markdown file is compatible with common Markdown editors
**And** the file can be used in static site generators (Jekyll, Hugo, etc.)

**Given** I select "Export as PDF"
**When** export is generated
**Then** I receive a PDF file with:
  - Properly formatted document
  - Article title as header
  - Formatted content (headings, paragraphs, lists)
  - Images included
  - Page numbers
  - Table of contents (if article is long)
  - Metadata (author, date, keyword)
**And** the PDF is professionally formatted
**And** the PDF can be opened in any PDF viewer

**Given** I select "Export as DOCX"
**When** export is generated
**Then** I receive a Word document with:
  - Formatted content (styles, headings, paragraphs)
  - Images embedded
  - Proper document structure
  - Metadata in document properties
**And** the DOCX file can be opened in Microsoft Word or Google Docs
**And** formatting is preserved

**Given** I want to export multiple articles
**When** I select multiple articles and click "Bulk Export"
**Then** I can select export format
**And** all selected articles are exported
**And** I receive a ZIP file containing all exported articles
**And** each article is in a separate file
**And** file names are based on article titles

**Technical Notes:**
- HTML export: Generate HTML from article content
- Markdown export: Convert HTML to Markdown (turndown or similar)
- PDF export: Use library like Puppeteer, jsPDF, or similar
- DOCX export: Use library like docx or mammoth
- Export processing: Via Inngest worker for large exports (async)
- File delivery: Download link or email delivery (for large files)

---

### Epic 6: Analytics & Performance Tracking
**User Outcome:** Users can track article performance, keyword rankings, content quality metrics, and generate shareable reports.

**FRs covered:** FR73-FR86

**Key Capabilities:**
- View dashboard with success metrics (time saved, content output, ROI)
- Track article performance (views, rankings, conversions)
- View keyword ranking data (position tracking over time)
- View content quality metrics (readability, SEO score, citation count)
- View feature adoption metrics
- Generate shareable attribution reports
- View analytics per project, per article, or aggregated
- Track time saved per user (10+ hours/week target)
- Measure content output increase (3× target)
- Calculate ROI per organization
- Generate case study data
- Identify modules that drive retention
- Surface unused features
- Recommend feature usage based on persona

**Dependencies:** Epic 5 (requires published articles to track)

**Success Metrics:**
- Real-time analytics updates (< 1 second latency - NFR-P3)
- 100% of published articles tracked

### Story 6.1: Persona-Specific Success Metrics Dashboard

**Priority:** P1 (Post-MVP - Tracking/optimization, not required)

As a user,
I want to view a dashboard with success metrics tailored to my persona,
So that I can track my progress toward my goals (time saved, content output, ROI).

**Acceptance Criteria:**

**Given** I am an Agency user (Sarah persona)
**When** I view the Analytics Dashboard
**Then** I see Agency-specific success metrics:
  - **Time Saved:** Hours saved this week (target: 10+ hours/week)
    - Current: "12.5 hours saved this week"
    - Progress bar: "125% of weekly goal"
    - Trend: "+2.5 hours vs last week"
  - **Content Output:** Articles generated this month (target: 3× baseline)
    - Current: "24 articles this month"
    - Baseline comparison: "8 articles/month baseline → 3× increase"
    - Trend: "+6 articles vs last month"
  - **ROI:** Cost savings vs. previous method
    - Current: "$1,440 saved this month" (vs. $600/article with writers)
    - Calculation: (Articles × $600) - (Articles × $60) = Savings
    - Trend: "+$360 vs last month"
**And** metrics are displayed in prominent Metric Cards (Epic 2.4)
**And** I can click metrics to see detailed breakdowns

**Given** I am an E-Commerce user (Marcus persona)
**When** I view the Analytics Dashboard
**Then** I see E-Commerce-specific success metrics:
  - **Revenue Attributed:** Total revenue from content (Epic 7)
    - Current: "$12,450 attributed this month"
    - Trend: "+$2,100 vs last month"
    - Top article: "Best Running Shoes Guide: $3,200"
  - **Conversion Rate Improvement:** Before/after comparison
    - Current: "2.8% conversion rate" (vs. 2.0% baseline)
    - Improvement: "+40% conversion rate increase"
  - **Product Descriptions Generated:** Count and impact
    - Current: "45 product descriptions generated"
    - Time saved: "22.5 hours saved"
**And** revenue attribution is prominently displayed
**And** I can see which articles drive the most revenue

**Given** I am a SaaS/Growth user (Jessica persona)
**When** I view the Analytics Dashboard
**Then** I see SaaS-specific success metrics:
  - **Organic Traffic Growth:** Visitors/month (target: 10K/month)
    - Current: "7,500 visitors this month"
    - Progress: "75% of 10K goal"
    - Trend: "+2,500 vs last month"
  - **Ranking Performance:** Keywords in top 10
    - Current: "32 keywords in top 10" (target: 50%+ in top 5)
    - Trend: "+8 keywords vs last month"
  - **Signup Attribution:** Signups from content
    - Current: "180 signups from content" (30% of total)
    - Trend: "+45 signups vs last month"
**And** traffic growth is prominently displayed
**And** I can see progress toward 10K visitors/month goal

**Given** I want to see metric trends over time
**When** I view success metrics
**Then** I can see:
  - Trend indicators (up/down arrows with percentage)
  - Mini charts (sparklines) showing trends over time
  - Comparison periods (vs. last week, last month, last quarter)
  - Historical data (click to see full chart)
**And** trends update in real-time as data changes

**Given** I want to customize my dashboard
**When** I view success metrics
**Then** I can:
  - Show/hide specific metrics
  - Change comparison periods
  - Set custom goals (override defaults)
  - Export metrics data (CSV, PDF)
**And** customizations are saved to my preferences

**Technical Notes:**
- Success metrics calculated from usage data, article performance, and analytics
- Persona-specific metrics: Determined by user persona selection (Epic 2.2)
- Real-time updates: Via websockets (NFR-P3: < 1 second latency)
- Metric calculations: Stored in `user_metrics` or `organization_metrics` table
- Trend calculations: Compare current period to previous period

---

### Story 6.2: Article Performance Tracking (Views, Rankings, Conversions)

**Priority:** P1 (Post-MVP - Tracking/optimization, not required)

As a user,
I want to track article performance metrics,
So that I can understand which articles are most effective and optimize my content strategy.

**Acceptance Criteria:**

**Given** I have published articles
**When** I view an article in the article list or editor
**Then** I can see article performance metrics:
  - **Views:** Total page views (from Google Analytics or CMS analytics)
    - Current: "1,247 views"
    - Trend: "+234 views vs last week"
    - Views over time chart (7-day, 30-day, 90-day)
  - **Rankings:** Keyword ranking positions
    - Primary keyword: "best running shoes" - Position 3 (↑ from 5)
    - Related keywords: 5 keywords ranking in top 10
    - Ranking trend chart (position over time)
  - **Conversions:** Conversions attributed to article
    - Signups: "12 signups from this article"
    - Revenue: "$450 revenue attributed" (E-Commerce only)
    - Conversion rate: "2.1% conversion rate"
**And** metrics are displayed in a performance card
**And** I can click to see detailed analytics

**Given** I want to see detailed article performance
**When** I click "View Analytics" on an article
**Then** I see a detailed performance page with:
  - **Traffic Metrics:**
    - Page views (daily, weekly, monthly)
    - Unique visitors
    - Average time on page
    - Bounce rate
    - Traffic sources (organic, direct, social, referral)
  - **SEO Metrics:**
    - Keyword rankings (all keywords, position over time)
    - Click-through rate (CTR) from search results
    - Impressions in search results
    - Average position
  - **Engagement Metrics:**
    - Scroll depth (how far users scroll)
    - Time on page
    - Exit rate
    - Social shares (if tracked)
  - **Conversion Metrics:**
    - Signups/conversions from article
    - Revenue attributed (if applicable)
    - Conversion rate
    - Attribution window (7-day, 30-day)
**And** I can filter by date range (7 days, 30 days, 90 days, custom)
**And** I can compare periods (vs. previous period)

**Given** I want to track performance across articles
**When** I view "Article Performance" in Analytics
**Then** I see a table/list of all articles with:
  - Article title
  - Views (total, trend)
  - Rankings (average position, keywords in top 10)
  - Conversions (signups, revenue)
  - Performance score (calculated composite score)
**And** I can sort by any metric (views, rankings, conversions)
**And** I can filter by:
  - Date published
  - Performance range (top performers, underperformers)
  - Keyword category
  - Conversion status
**And** I can export performance data (CSV, PDF)

**Given** article performance data is collected
**When** data is updated
**Then** performance metrics update automatically:
  - Views: Updated daily (from Google Analytics API or CMS analytics)
  - Rankings: Updated daily (from Google Search Console API)
  - Conversions: Updated in real-time (from attribution tracking - Epic 7)
**And** updates happen in the background (no user action required)
**And** I see "Last updated: 2 hours ago" timestamp

**Given** I want to compare article performance
**When** I select multiple articles
**Then** I can see a comparison view:
  - Side-by-side metrics comparison
  - Performance trends comparison
  - Best/worst performing articles highlighted
**And** I can identify top performers and content gaps

**Technical Notes:**
- Performance data sources:
  - Views: Google Analytics API or CMS analytics
  - Rankings: Google Search Console API
  - Conversions: Attribution tracking (Epic 7)
- Data collection: Daily updates via scheduled jobs (Inngest cron)
- Performance storage: `article_performance` table with daily snapshots
- Real-time updates: Via websockets for recent data

---

### Story 6.3: Keyword Ranking Data and Position Tracking

**Priority:** P1 (Post-MVP - Tracking/optimization, not required)

As a user,
I want to view keyword ranking data and track position changes over time,
So that I can monitor SEO performance and identify ranking opportunities.

**Acceptance Criteria:**

**Given** I have articles targeting keywords
**When** I view "Keyword Rankings" in Analytics
**Then** I see a list of all tracked keywords with:
  - Keyword
  - Target article (which article targets this keyword)
  - Current position (1-100, or "Not ranking")
  - Position change (↑, ↓, → with number)
  - Search volume
  - Difficulty
  - Last updated date
**And** keywords are sorted by position (best rankings first)
**And** I can filter by:
  - Position range (top 10, top 20, etc.)
  - Position change (improving, declining, stable)
  - Article
  - Date range

**Given** I want to see ranking trends
**When** I click on a keyword
**Then** I see a detailed ranking history with:
  - Position over time chart (line chart showing position changes)
  - Historical positions (daily snapshots)
  - Ranking milestones (first time in top 10, etc.)
  - Related keywords (keywords ranking for the same article)
  - Competitor analysis (who else ranks for this keyword)
**And** I can see ranking trends (improving, declining, stable)
**And** I can export ranking data (CSV, PDF)

**Given** keyword rankings are tracked
**When** rankings are updated
**Then** the system:
  - Queries Google Search Console API daily for ranking data
  - Stores daily position snapshots
  - Calculates position changes (vs. previous day, week, month)
  - Identifies ranking improvements and declines
  - Sends notifications for significant changes (entered top 10, dropped out of top 10)
**And** updates happen automatically (no user action required)
**And** I see "Last updated: Today at 2:00 AM" timestamp

**Given** I want to track new keywords
**When** I generate an article with a target keyword
**Then** the keyword is automatically added to ranking tracking
**And** ranking tracking starts immediately
**And** I can see ranking status: "Tracking started" or "Not ranking yet"
**And** I receive a notification when the keyword first appears in rankings

**Given** I want to see ranking performance summary
**When** I view "Ranking Overview" in Analytics
**Then** I see summary metrics:
  - Total keywords tracked: "45 keywords"
  - Keywords in top 10: "18 keywords (40%)"
  - Keywords in top 20: "28 keywords (62%)"
  - Average position: "12.5"
  - Keywords improving: "12 keywords (↑)"
  - Keywords declining: "5 keywords (↓)"
**And** I can see trends over time (ranking performance improving/declining)
**And** I can drill down to see which articles drive rankings

**Given** I want to identify ranking opportunities
**When** I view keyword rankings
**Then** I can see:
  - Keywords close to top 10 (positions 11-15) - opportunities
  - Keywords with high search volume but low position - opportunities
  - Keywords declining - need attention
  - Keywords improving - success stories
**And** I can create action items (improve content, build links, etc.)

**Technical Notes:**
- Ranking data: Google Search Console API (URL Inspection API or Performance API)
- Daily tracking: Inngest cron job queries Search Console daily
- Position storage: `keyword_rankings` table with daily snapshots
- Ranking calculations: Position changes, trends, averages
- Notifications: For significant ranking changes (top 10 entry/exit)

---

### Story 6.4: Content Quality Metrics Dashboard

**Priority:** P1 (Post-MVP - Tracking/optimization, not required)

As a user,
I want to view content quality metrics for my articles,
So that I can ensure content meets quality standards and identify improvement opportunities.

**Acceptance Criteria:**

**Given** I have generated articles
**When** I view "Content Quality" in Analytics
**Then** I see quality metrics for each article:
  - **Readability Score:** Flesch-Kincaid score (0-100)
    - Current: "72 (Good readability)"
    - Target: "60+ (NFR-DQ1: 70%+ articles score > 60)"
    - Trend: "+5 vs average"
  - **SEO Score:** Overall SEO optimization (0-100)
    - Current: "85/100"
    - Breakdown: Keyword optimization, heading structure, meta tags, etc.
    - Target: "70+ for good SEO"
  - **Citation Count:** Number of citations included
    - Current: "8 citations"
    - Target: "3+ citations (NFR-DQ2: 80%+ articles include 3+ citations)"
    - Citation sources listed
  - **Word Count:** Article length
    - Current: "3,247 words"
    - Target: "3,000+ words for comprehensive content"
**And** metrics are displayed in quality cards
**And** I can see which articles meet quality standards

**Given** I want to see quality trends
**When** I view content quality metrics
**Then** I can see:
  - Average quality scores over time
  - Quality distribution (how many articles meet each threshold)
  - Quality trends (improving, declining, stable)
  - Quality by article category or keyword
**And** I can identify quality improvement opportunities

**Given** I want to see quality breakdown
**When** I click on an article's quality metrics
**Then** I see detailed quality analysis:
  - **Readability Breakdown:**
    - Sentence length analysis
    - Word complexity analysis
    - Readability recommendations
  - **SEO Breakdown:**
    - Keyword density (target: 1-2%)
    - Heading structure (H1, H2, H3 analysis)
    - Meta tags completeness
    - Internal linking score
    - Schema markup presence
  - **Citation Breakdown:**
    - Citation sources (authority, relevance)
    - Citation placement (in-text, references)
    - Citation formatting
  - **Content Structure:**
    - Section organization
    - Content depth
    - Image usage
**And** I can see recommendations for improvement
**And** I can regenerate sections to improve quality (Epic 4B.3)

**Given** I want to track quality over time
**When** I view quality metrics
**Then** I can see:
  - Quality trends (average scores over time)
  - Quality by article age (newer vs. older articles)
  - Quality by writing style or template
  - Quality improvements after regeneration
**And** I can identify which factors improve quality

**Given** I want to ensure quality standards
**When** I view quality metrics
**Then** I can see:
  - Articles meeting quality standards (green badge)
  - Articles below quality standards (yellow/red badge)
  - Quality compliance rate: "85% of articles meet quality standards"
  - Recommendations for improving low-quality articles
**And** I can filter by quality status
**And** I can bulk regenerate low-quality articles

**Technical Notes:**
- Quality metrics calculated during article generation (Epic 4A)
- Readability: Flesch-Kincaid algorithm
- SEO score: Composite score from multiple factors (keyword density, headings, meta tags, etc.)
- Citation count: Counted from article content
- Quality storage: Stored in `articles` table (quality_metrics JSONB column)

---

### Story 6.5: Feature Adoption Metrics and Usage Analytics

**Priority:** P1 (Post-MVP - Tracking/optimization, not required)

As a user,
I want to view feature adoption metrics,
So that I can understand which features are most valuable and identify unused features.

**Acceptance Criteria:**

**Given** I am an organization owner or admin
**When** I view "Feature Adoption" in Analytics
**Then** I see feature usage metrics:
  - **Feature Usage Count:** How many times each feature is used
    - Article Generation: "245 uses this month"
    - Keyword Research: "89 uses this month"
    - Publishing: "156 uses this month"
    - Revenue Attribution: "12 uses this month" (if applicable)
  - **Feature Adoption Rate:** % of users using each feature
    - Article Generation: "95% of users"
    - Keyword Research: "78% of users"
    - Publishing: "82% of users"
  - **Feature Growth:** Adoption trends over time
    - "Article Generation: +15% vs last month"
    - "Revenue Attribution: +25% vs last month"
**And** features are displayed in a usage dashboard
**And** I can see which features drive retention

**Given** I want to see detailed feature usage
**When** I click on a feature
**Then** I see:
  - Usage over time (daily, weekly, monthly)
  - Usage by user/team member
  - Usage patterns (time of day, day of week)
  - Feature success rate (completion rate, error rate)
  - Feature value metrics (time saved, articles generated, etc.)
**And** I can identify power users and feature champions

**Given** I want to identify unused features
**When** I view feature adoption metrics
**Then** I can see:
  - Features with low adoption (< 20% of users)
  - Features never used by my organization
  - Features with declining usage
**And** I can see recommendations:
  - "Revenue Attribution is available but unused. Learn more →"
  - "Bulk Publishing can save time. Try it →"
**And** I can access feature tutorials or documentation

**Given** I want to see feature impact on retention
**When** I view feature adoption analytics
**Then** I can see:
  - Features correlated with user retention
  - Features used by long-term customers
  - Features that drive upgrades
  - Feature usage patterns of churned users
**And** I can identify which features to promote to improve retention

**Given** I want to see team feature usage
**When** I view feature adoption (for organizations)
**Then** I can see:
  - Feature usage by team member
  - Team members who are feature champions
  - Team members who might need training
  - Feature adoption across projects
**And** I can identify training opportunities

**Technical Notes:**
- Feature tracking: Event tracking system (PostHog, Mixpanel, or custom)
- Usage events: Tracked for all major features (article generation, publishing, etc.)
- Adoption metrics: Calculated from usage events
- Retention correlation: Analyze feature usage vs. user retention
- Feature recommendations: Based on usage patterns and persona

---

### Story 6.6: Shareable Attribution Reports Generation

**Priority:** P1 (Post-MVP - Tracking/optimization, not required)

As a user,
I want to generate shareable attribution reports for stakeholders,
So that I can demonstrate content ROI and justify content marketing investments.

**Acceptance Criteria:**

**Given** I want to create an attribution report
**When** I navigate to Analytics > Reports > Create Report
**Then** I can configure report options:
  - Report type: "Attribution Report", "Performance Report", "ROI Report"
  - Date range (last 7 days, 30 days, 90 days, custom)
  - Scope: "All Articles", "Specific Articles", "By Project", "By Client" (for agencies)
  - Include metrics: Success metrics, article performance, rankings, conversions, ROI
  - Format: "PDF", "PowerPoint", "Excel", "Shareable Link"
**And** I can preview the report before generating

**Given** I generate an Attribution Report
**When** the report is created
**Then** the report includes:
  - **Executive Summary:**
    - Total articles published
    - Total traffic/views
    - Total conversions/signups
    - Total revenue attributed (if applicable)
    - ROI calculation
  - **Article Performance:**
    - Top 10 performing articles
    - Performance metrics (views, rankings, conversions)
    - Revenue per article (if applicable)
  - **Keyword Performance:**
    - Keywords ranking in top 10
    - Ranking improvements
    - Search volume and difficulty
  - **Success Metrics:**
    - Time saved (for agencies)
    - Content output increase
    - Traffic growth
    - ROI and cost savings
  - **Visualizations:**
    - Charts and graphs (traffic trends, ranking trends, conversion trends)
    - Performance comparisons
    - Goal progress indicators
**And** report is professionally formatted
**And** report is branded (organization logo, colors)

**Given** I generate a report
**When** report generation completes
**Then** I can:
  - Download report (PDF, PowerPoint, Excel)
  - Share report via link (password-protected, optional)
  - Email report to stakeholders
  - Schedule automatic report generation (weekly, monthly)
**And** shared reports are accessible via secure link
**And** I can set link expiration (7 days, 30 days, never)

**Given** I want to customize report branding
**When** I generate a report
**Then** I can:
  - Add organization logo
  - Customize colors and fonts
  - Add custom cover page
  - Include custom sections or notes
**And** branding is applied to the report
**And** customizations are saved for future reports

**Given** I schedule automatic reports
**When** scheduled report time arrives
**Then** report is automatically generated
**And** report is emailed to specified recipients
**And** I receive a notification: "Monthly report generated and sent"
**And** I can view scheduled reports in "Scheduled Reports" section

**Given** I share a report via link
**When** stakeholders access the link
**Then** they can view the report in a web viewer
**And** they can download the report (if permissions allow)
**And** they cannot edit the report
**And** access is logged (who viewed, when)

**Technical Notes:**
- Report generation: Server-side rendering (PDF, PowerPoint, Excel)
- Report templates: Professional templates for different report types
- Shareable links: Secure, password-protected links (optional)
- Scheduled reports: Inngest cron jobs for automatic generation
- Report storage: Cloudflare R2 or Supabase Storage

---

### Story 6.7: Analytics Filtering (Per Project, Per Article, Aggregated)

**Priority:** P1 (Post-MVP - Tracking/optimization, not required)

As a user,
I want to view analytics filtered by project, article, or aggregated across all content,
So that I can analyze performance at different levels of granularity.

**Acceptance Criteria:**

**Given** I want to view analytics
**When** I navigate to Analytics Dashboard
**Then** I can select view scope:
  - **Aggregated:** All articles, all projects (organization-wide)
  - **By Project:** Filter by specific project (for agencies)
  - **By Article:** Filter by specific article
  - **By Client:** Filter by client (for agencies)
  - **By Date Range:** Filter by date range
**And** selected scope is applied to all analytics views
**And** scope is saved in URL (shareable links)

**Given** I select "Aggregated" view
**When** I view analytics
**Then** I see organization-wide metrics:
  - Total articles published
  - Total views across all articles
  - Total conversions/signups
  - Average performance metrics
  - Overall ROI
**And** metrics are summed/averaged across all content
**And** I can see trends over time

**Given** I select "By Project" view
**When** I filter by a specific project
**Then** I see project-specific metrics:
  - Articles in this project
  - Project performance (views, rankings, conversions)
  - Project ROI
  - Project success metrics
**And** I can compare projects side-by-side
**And** I can see which projects perform best

**Given** I select "By Article" view
**When** I filter by a specific article
**Then** I see article-specific metrics (Story 6.2)
**And** I can see detailed performance for that article
**And** I can compare article to organization average

**Given** I select "By Client" view (for agencies)
**When** I filter by a specific client
**Then** I see client-specific metrics:
  - Articles for this client
  - Client performance (views, rankings, conversions)
  - Client ROI
  - Client success metrics
**And** I can generate client-specific reports (Story 6.6)
**And** I can compare clients

**Given** I want to combine filters
**When** I view analytics
**Then** I can apply multiple filters:
  - Project + Date Range
  - Client + Article Category
  - Date Range + Performance Range
**And** all filters work together (AND logic)
**And** I can see active filters as badges
**And** I can clear individual filters or clear all

**Given** I want to save filter combinations
**When** I apply filters
**Then** I can save the filter combination as a "Saved View"
**And** I can name the saved view (e.g., "Q1 Content Performance")
**And** I can access saved views from a dropdown
**And** applying a saved view restores all filters

**Technical Notes:**
- Analytics filtering: Client-side for small datasets, server-side for large datasets
- Filter state: Persisted in URL query parameters (shareable)
- Saved views: Stored in `user_preferences` or `saved_analytics_views` table
- Multi-level filtering: Project → Article → Date Range hierarchy

---

### Story 6.8: Time Saved Tracking and Success Metric Calculation

**Priority:** P1 (Post-MVP - Tracking/optimization, not required)

As the system,
I want to track time saved per user,
So that I can measure success against the 10+ hours/week target for agencies.

**Acceptance Criteria:**

**Given** users perform content operations
**When** operations are completed
**Then** the system calculates time saved:
  - **Article Generation:** 
    - Baseline: 10 hours per article (manual research + writing)
    - Actual: 5 minutes (automated generation)
    - Time saved: 9 hours 55 minutes per article
  - **Keyword Research:**
    - Baseline: 2 hours per research session
    - Actual: 1 minute (automated research)
    - Time saved: 1 hour 59 minutes per session
  - **Publishing:**
    - Baseline: 30 minutes per article (manual publishing + formatting)
    - Actual: 10 seconds (one-click publishing)
    - Time saved: 29 minutes 50 seconds per article
**And** time saved is tracked per operation
**And** time saved is aggregated per user per week

**Given** time saved is tracked
**When** I view my success metrics (Story 6.1)
**Then** I see:
  - **Time Saved This Week:** "12.5 hours saved"
  - **Weekly Goal Progress:** "125% of 10 hours/week goal"
  - **Time Saved Breakdown:**
    - Article generation: "8.5 hours"
    - Keyword research: "3.2 hours"
    - Publishing: "0.8 hours"
  - **Trend:** "+2.5 hours vs last week"
**And** I can see time saved over time (weekly, monthly)
**And** I can see which operations save the most time

**Given** I am an agency user
**When** I view time saved metrics
**Then** I see:
  - Time saved across all team members (aggregated)
  - Time saved per team member
  - Time saved per client
  - Time saved per project
**And** I can identify which team members or clients save the most time
**And** I can see team progress toward 10+ hours/week goal

**Given** time saved calculations
**When** time saved is calculated
**Then** baseline times are configurable:
  - Default baselines: 10 hours/article, 2 hours/research, 30 min/publishing
  - Custom baselines: Users can set their own baselines
  - Baseline updates: Baselines can be updated as processes improve
**And** time saved is calculated accurately
**And** time saved is stored in `user_time_saved` table

**Given** I want to see time saved trends
**When** I view time saved analytics
**Then** I can see:
  - Time saved over time (weekly, monthly trends)
  - Time saved by operation type
  - Time saved efficiency (time saved per article)
  - Projected annual time savings
**And** I can export time saved data (CSV, PDF)

**Technical Notes:**
- Time saved calculation: Baseline time - Actual time = Time saved
- Baseline times: Configurable, stored in `time_saved_baselines` table
- Time tracking: Tracked per operation, aggregated per user/week
- Success metric: 10+ hours/week target for agencies (FR80)

---

### Story 6.9: Content Output Increase Measurement

**Priority:** P1 (Post-MVP - Tracking/optimization, not required)

As the system,
I want to measure content output increase,
So that I can track success against the 3× content output target.

**Acceptance Criteria:**

**Given** users publish articles
**When** articles are published
**Then** the system tracks:
  - Articles published per month
  - Articles published over time (daily, weekly, monthly)
  - Content output trends
**And** content output is stored in `content_output` table

**Given** content output is tracked
**When** I view success metrics (Story 6.1)
**Then** I see:
  - **Content Output This Month:** "24 articles"
  - **Baseline Comparison:** "8 articles/month baseline → 3× increase"
  - **Output Trend:** "+6 articles vs last month"
  - **Output Goal Progress:** "300% of baseline (3× target achieved)"
**And** I can see content output over time (monthly trends)
**And** I can see which months had highest output

**Given** I want to set a baseline
**When** I first use Infin8Content
**Then** I can set my baseline:
  - Enter baseline articles/month (e.g., "4 articles/month")
  - Or import baseline from previous period (if data available)
  - Baseline is stored and used for comparison
**And** I can update baseline later if needed
**And** baseline is used to calculate 3× target

**Given** content output is measured
**When** I view content output analytics
**Then** I can see:
  - Content output over time (monthly chart)
  - Output by article type/category
  - Output by project (for agencies)
  - Output by team member (for organizations)
  - Output efficiency (articles per hour of work)
**And** I can identify factors that increase output

**Given** I am an agency user
**When** I view content output
**Then** I see:
  - Content output across all clients
  - Content output per client
  - Content output per team member
  - Client output comparisons
**And** I can see which clients have highest output
**And** I can see team productivity metrics

**Given** content output measurement
**When** output is calculated
**Then** the system:
  - Tracks articles published (not just generated)
  - Excludes drafts and unpublished articles
  - Counts articles per calendar month
  - Calculates 3× target: Baseline × 3
  - Compares current output to baseline and target
**And** calculations are accurate
**And** output metrics update in real-time

**Technical Notes:**
- Content output tracking: Count published articles per month
- Baseline setting: User-configurable, stored in `user_baselines` table
- 3× target: Baseline × 3 (FR81)
- Output storage: `content_output` table with monthly snapshots

---

### Story 6.10: ROI Calculation Per Organization

**Priority:** P1 (Post-MVP - Tracking/optimization, not required)

As the system,
I want to calculate ROI per organization,
So that users can demonstrate content marketing ROI and justify investments.

**Acceptance Criteria:**

**Given** an organization uses Infin8Content
**When** ROI is calculated
**Then** the system calculates:
  - **Cost Savings:**
    - Previous method cost: (Articles × $600/article with writers) or custom baseline
    - Current method cost: (Articles × $60/article with Infin8Content) + Subscription cost
    - Cost savings: Previous cost - Current cost
  - **Revenue Impact:**
    - Revenue attributed to content (Epic 7 - for e-commerce)
    - Signups/conversions from content (for SaaS)
    - Revenue value: (Signups × ARPU) or (Revenue attributed)
  - **ROI Calculation:**
    - ROI = (Revenue Impact + Cost Savings) / Investment × 100
    - Investment = Subscription cost + Usage costs
**And** ROI is calculated monthly
**And** ROI is stored in `organization_roi` table

**Given** ROI is calculated
**When** I view success metrics (Story 6.1)
**Then** I see:
  - **ROI This Month:** "450% ROI"
  - **Cost Savings:** "$1,440 saved this month"
  - **Revenue Impact:** "$12,450 revenue attributed" (if applicable)
  - **Investment:** "$180 (subscription + usage)"
  - **ROI Breakdown:**
    - Cost savings component
    - Revenue impact component
    - Total ROI
**And** I can see ROI trends over time
**And** I can see ROI by project or client (for agencies)

**Given** I want to see detailed ROI analysis
**When** I view ROI metrics
**Then** I can see:
  - ROI calculation breakdown (formula and components)
  - ROI over time (monthly trends)
  - ROI by article (which articles drive highest ROI)
  - ROI by project/client (for agencies)
  - ROI projections (projected annual ROI)
**And** I can export ROI data (CSV, PDF)
**And** I can include ROI in attribution reports (Story 6.6)

**Given** ROI calculations
**When** ROI is calculated
**Then** the system:
  - Uses accurate cost data (subscription, usage, overages)
  - Uses accurate revenue data (attribution tracking - Epic 7)
  - Handles different personas (Agency, E-Commerce, SaaS) with different ROI components
  - Updates ROI calculations monthly
  - Stores historical ROI data
**And** calculations are transparent (users can see formula)

**Given** I want to customize ROI calculation
**When** I view ROI settings
**Then** I can:
  - Set custom baseline costs (if different from $600/article)
  - Set custom revenue attribution (if different from standard)
  - Include/exclude specific cost components
  - Set custom ROI calculation method
**And** customizations are saved
**And** ROI is recalculated with custom settings

**Technical Notes:**
- ROI calculation: (Revenue + Cost Savings) / Investment × 100
- Cost tracking: Subscription + Usage + Overage costs
- Revenue tracking: Attribution data from Epic 7
- ROI storage: `organization_roi` table with monthly snapshots
- Customization: User-configurable ROI calculation parameters

---

### Epic 7: E-Commerce Integration & Revenue Attribution ⭐ **PRIORITIZED**
**User Outcome:** Users can connect e-commerce stores, sync product catalogs, generate product descriptions, and track revenue attribution from content.

**FRs covered:** FR69-FR77

**Key Capabilities:**
- Connect e-commerce stores (Shopify, WooCommerce)
- Sync product catalogs (products, prices, images, inventory)
- Generate product descriptions from product data
- Automatically link to relevant products in blog content
- Generate UTM parameters for content links (tracking attribution)
- Match e-commerce orders to content via UTM tracking
- View revenue attribution reports (which articles drove sales, revenue per article)
- Export revenue attribution data for stakeholder reporting
- Manage multiple e-commerce stores per organization

**Dependencies:** Epic 5 (requires publishing to track attribution), Epic 6 (requires analytics infrastructure)

**Strategic Priority:** **HIGHEST** - This is the #1 differentiator (12-18 month competitive lead). E-commerce segment represents 50% of customers and 56% of revenue. Revenue attribution enables viral marketing ("Our content generated $50K in revenue").

**Success Metrics:**
- 80%+ attribution accuracy (PRD validation target)
- Revenue attribution visible in < 24 hours after order
- 50%+ of e-commerce customers use revenue attribution within 30 days

### Story 7.1: E-Commerce Store Connection (Shopify and WooCommerce)

**Priority:** P1 (Post-MVP - Advanced feature, not core promise)

As a user,
I want to connect my e-commerce stores (Shopify and WooCommerce),
So that I can sync product catalogs and track revenue attribution from content.

**Acceptance Criteria:**

**Given** I am in Settings > Integrations > E-Commerce Stores
**When** I want to add an e-commerce store
**Then** I see supported platforms:
  - Shopify
  - WooCommerce
**And** each platform shows connection method (OAuth for Shopify, API credentials for WooCommerce)
**And** I can click "Connect" for any platform

**Given** I click "Connect" for Shopify
**When** I configure Shopify connection
**Then** I am redirected to Shopify OAuth flow
**And** I authorize the app in Shopify (with required permissions: read_products, read_orders)
**And** I am redirected back to Infin8Content
**And** OAuth tokens are stored (encrypted at rest - NFR-S6)
**And** connection is established
**And** I can see connected store name, URL, and status
**And** store connection is validated (test API call)

**Given** I click "Connect" for WooCommerce
**When** I configure WooCommerce connection
**Then** I can enter:
  - Store URL (e.g., https://mysite.com)
  - Consumer Key (WooCommerce API key)
  - Consumer Secret (WooCommerce API secret)
**And** I can test the connection before saving
**And** if connection test succeeds, credentials are saved (encrypted)
**And** if connection test fails, I see a clear error message with troubleshooting steps
**And** connection is validated (test API call to WooCommerce REST API)

**Given** I have connected e-commerce stores
**When** I view E-Commerce Stores
**Then** I see all connected stores with:
  - Store name and platform (Shopify/WooCommerce)
  - Store URL
  - Connection status (Connected, Error, Expired)
  - Product count (synced products)
  - Last synced date
  - Quick actions: "Sync Products", "Test Connection", "Edit", "Disconnect"
**And** I can manage connections (edit, disconnect, reconnect)

**Given** I want to validate a connection
**When** I click "Test Connection"
**Then** the system makes a test API call:
  - Shopify: GET /admin/api/2024-01/shop.json
  - WooCommerce: GET /wp-json/wc/v3/system_status
**And** if validation succeeds, I see "Connection successful"
**And** if validation fails, I see error message with troubleshooting steps
**And** connection status is updated

**Given** I have multiple stores
**When** I view E-Commerce Stores
**Then** I can see all stores in a list
**And** I can manage multiple stores per organization (FR65)
**And** each store is independent (separate product catalogs, separate attribution tracking)
**And** I can set a default store for product operations

**Technical Notes:**
- Shopify: OAuth 2.0 flow, requires read_products and read_orders scopes
- WooCommerce: REST API with Consumer Key/Secret authentication
- Credential storage: Encrypted at rest (AES-256), decrypted only in worker memory (NFR-S6)
- Connection validation: Test API call before saving or using credentials
- OAuth token refresh: Automatic refresh for Shopify (Story 5.8 pattern)

---

### Story 7.2: Product Catalog Synchronization

**Priority:** P1 (Post-MVP - Advanced feature, not core promise)

As the system,
I want to sync product catalogs from connected e-commerce stores,
So that I can access product data for generating descriptions and linking products in content.

**Acceptance Criteria:**

**Given** I have a connected e-commerce store (Story 7.1)
**When** I click "Sync Products" or automatic sync runs
**Then** the system:
  - Fetches products from the store API:
    - Shopify: GET /admin/api/2024-01/products.json
    - WooCommerce: GET /wp-json/wc/v3/products
  - Syncs product data:
    - Product ID, SKU, title, description
    - Price (current price, compare-at price if on sale)
    - Images (product images, featured image)
    - Inventory status (in stock, out of stock, quantity)
    - Product categories/tags
    - Product URL (store product page URL)
  - Stores products in `products` table
  - Updates existing products or creates new ones
**And** I see sync progress: "Syncing products... 45 of 120"
**And** sync completes successfully

**Given** product sync completes
**When** I view Products in the platform
**Then** I can see all synced products with:
  - Product image (thumbnail)
  - Product title
  - Price
  - Inventory status
  - Last synced date
  - Store source (which store this product is from)
**And** I can search and filter products
**And** I can see product count: "120 products synced"

**Given** I want to configure automatic sync
**When** I view store settings
**Then** I can set sync frequency:
  - Manual sync only
  - Daily sync (at specified time)
  - Hourly sync (for high-volume stores)
**And** automatic sync runs via Inngest scheduled jobs
**And** I receive notifications if sync fails

**Given** product sync fails
**When** an error occurs during sync
**Then** the system:
  - Retries sync (3 attempts with exponential backoff)
  - Logs error details
  - Notifies me: "Product sync failed for [Store Name]. Please check connection."
**And** partial sync results are preserved (products synced before failure)
**And** I can retry sync manually

**Given** products are synced
**When** product data changes in the store
**Then** the system updates product data on next sync:
  - Price changes are reflected
  - Inventory status updates
  - Product images update
  - Product descriptions update
**And** I can see "Last synced: 2 hours ago" timestamp
**And** I can see which products were updated

**Given** I want to see sync history
**When** I view store details
**Then** I can see:
  - Last sync date and time
  - Products synced (count)
  - Products updated (count)
  - Sync duration
  - Sync status (Success, Failed, Partial)
**And** I can view sync history (last 10 syncs)

**Technical Notes:**
- Product sync: Via Inngest workers (async, queue-based)
- API pagination: Handle large product catalogs (1000+ products)
- Data storage: `products` table with store_id foreign key
- Sync frequency: Configurable, default daily sync
- Error handling: Retry logic, partial sync preservation

---

### Story 7.3: Product Description Generation from Product Data

**Priority:** P1 (Post-MVP - Advanced feature, not core promise)

As a user,
I want to generate product descriptions from product data,
So that I can create SEO-optimized product descriptions quickly.

**Acceptance Criteria:**

**Given** I have synced products (Story 7.2)
**When** I view a product in the Products section
**Then** I can see product details:
  - Product title, SKU, price
  - Current description (if any)
  - Product images
  - Product attributes (size, color, material, etc.)
**And** I can click "Generate Description" or "Improve Description"

**Given** I click "Generate Description"
**When** description generation starts
**Then** the system:
  - Uses product data (title, attributes, images, category)
  - Generates SEO-optimized product description using LLM (OpenRouter)
  - Includes product features and benefits
  - Optimizes for target keywords (product category keywords)
  - Generates 200-500 word description
**And** I see generation progress: "Generating description..."
**And** description is generated in < 30 seconds

**Given** product description is generated
**When** I view the generated description
**Then** I can:
  - Review the description
  - Edit the description (rich text editor)
  - Regenerate description (if not satisfied)
  - Accept and save description
**And** description is saved to product record
**And** I can publish description to the store (if store API supports it)

**Given** I want to generate descriptions in bulk
**When** I select multiple products
**Then** I can click "Bulk Generate Descriptions"
**And** descriptions are generated for all selected products
**And** I see progress: "Generating descriptions... 5 of 20"
**And** I can review and edit each description
**And** I can accept all or accept individually

**Given** I generate a product description
**When** description is saved
**Then** the description:
  - Is SEO-optimized (includes relevant keywords)
  - Highlights product features and benefits
  - Is engaging and conversion-focused
  - Matches brand voice (if writing style configured)
  - Is properly formatted (paragraphs, lists, etc.)
**And** description can be used in:
  - Store product pages (if published)
  - Blog content (product mentions)
  - Social media posts

**Given** I want to customize description generation
**When** I generate a description
**Then** I can configure:
  - Description length (short, medium, long)
  - Writing style/tone (professional, conversational, technical)
  - Focus (features, benefits, SEO, conversion)
  - Include/exclude specific product attributes
**And** customizations are applied during generation

**Technical Notes:**
- Description generation: Uses LLM (OpenRouter) with product data as context
- Product data: Title, attributes, images, category used as input
- SEO optimization: Includes product category keywords naturally
- Bulk generation: Processed via Inngest workers (async)
- Description storage: Stored in `products.description` column

---

### Story 7.4: Automatic Product Linking in Blog Content

**Priority:** P1 (Post-MVP - Advanced feature, not core promise)

As the system,
I want to automatically link to relevant products in blog content,
So that I can drive traffic to products and enable revenue attribution.

**Acceptance Criteria:**

**Given** I am generating or editing an article
**When** the article mentions products or product-related topics
**Then** the system analyzes article content and identifies:
  - Product mentions (explicit product names)
  - Product-related topics (keywords matching product categories)
  - Contextual relevance (article topic matches product category)
**And** relevant products are identified from synced product catalog (Story 7.2)

**Given** relevant products are identified
**When** I view the article editor
**Then** I see a "Suggested Product Links" panel with:
  - Product name and image
  - Product price
  - Relevance score (why this product is relevant)
  - Suggested anchor text
  - Suggested placement in article (which section)
**And** I can:
  - Accept suggestions (click "Add Link" to insert)
  - Reject suggestions (dismiss)
  - Edit anchor text before inserting
  - Choose different placement

**Given** I accept a product link suggestion
**When** I click "Add Link"
**Then** the link is inserted at the suggested location
**And** anchor text is used for the link
**And** the link includes UTM parameters (Story 7.5) for attribution tracking
**And** the link is formatted correctly: `[anchor text](product-url?utm_source=infin8content&utm_campaign=article_id&utm_content=product_id)`
**And** the link is saved with the article

**Given** I want to add product links manually
**When** I select text in the article
**Then** I can click "Add Product Link" from the editor toolbar
**And** I can search for products to link to
**And** I can select a product and insert the link
**And** the link includes UTM parameters automatically
**And** the link is formatted and saved

**Given** product links are added to articles
**When** the article is published (Epic 5)
**Then** product links are included in the published content
**And** links are properly formatted for the CMS platform
**And** UTM parameters are preserved
**And** clicks on product links are tracked for attribution (Story 7.6)

**Given** I want to see product link performance
**When** I view article analytics
**Then** I can see:
  - Product links in the article
  - Clicks per product link
  - Revenue attributed per product link (Story 7.7)
  - Top-performing product links
**And** I can identify which products drive the most revenue

**Technical Notes:**
- Product matching: Keyword/topic similarity analysis between article content and product catalog
- Relevance scoring: Based on keyword overlap, category match, semantic similarity
- Link insertion: Automatic or manual, with UTM parameters
- Link tracking: UTM parameters enable click and revenue attribution
- Product link storage: Stored in article content and `article_product_links` table

---

### Story 7.5: UTM Parameter Generation for Content Links

**Priority:** P1 (Post-MVP - Advanced feature, not core promise)

As the system,
I want to automatically generate UTM parameters for content links,
So that I can track which articles drive traffic and revenue.

**Acceptance Criteria:**

**Given** I publish an article or add product links (Story 7.4)
**When** links are created
**Then** the system automatically generates UTM parameters:
  - `utm_source=infin8content` (always)
  - `utm_medium=content` (or `product` for product links)
  - `utm_campaign=article_{article_id}` (article identifier)
  - `utm_content=product_{product_id}` (for product links, optional)
  - `utm_term={keyword}` (target keyword, optional)
**And** UTM parameters are appended to all links in the article
**And** UTM parameters are stored with the article

**Given** UTM parameters are generated
**When** I view article settings or links
**Then** I can see:
  - Generated UTM parameters for the article
  - UTM parameters for each product link
  - Example URLs with UTM parameters
**And** I can edit UTM parameters if needed (customize campaign name, etc.)
**And** changes are saved with the article

**Given** I publish an article
**When** the article is published to a CMS (Epic 5)
**Then** all links in the published content include UTM parameters:
  - Product links (with product-specific UTM parameters)
  - Internal links (with article-specific UTM parameters)
  - External links (with article-specific UTM parameters, if configured)
**And** UTM parameters are properly encoded (URL encoding)
**And** UTM parameters don't break existing link functionality

**Given** I want to customize UTM parameters
**When** I configure article settings
**Then** I can:
  - Set custom campaign name (instead of article_id)
  - Set custom medium (instead of "content")
  - Add custom UTM term (keyword or other identifier)
  - Override default UTM parameters
**And** customizations are saved
**And** custom UTM parameters are used for that article

**Given** UTM parameters are used
**When** users click links with UTM parameters
**Then** the e-commerce platform (Shopify/WooCommerce) tracks UTM parameters:
  - UTM parameters are included in order data (if available)
  - UTM parameters are accessible via webhooks (Story 7.6)
  - UTM parameters enable order-to-article matching
**And** UTM tracking enables revenue attribution

**Given** I want to see UTM tracking data
**When** I view article analytics
**Then** I can see:
  - UTM parameters used for the article
  - Clicks tracked via UTM parameters
  - Orders matched via UTM parameters (Story 7.6)
  - Revenue attributed via UTM tracking (Story 7.7)
**And** I can see UTM performance metrics

**Technical Notes:**
- UTM parameter generation: Automatic for all article links
- UTM format: Standard UTM parameters (source, medium, campaign, content, term)
- UTM storage: Stored in article metadata and link data
- URL encoding: Proper encoding of UTM parameter values
- UTM tracking: Enables order matching and revenue attribution

---

### Story 7.6: E-Commerce Order Matching via UTM Tracking

**Priority:** P1 (Post-MVP - Advanced feature, not core promise)

As the system,
I want to match e-commerce orders to content via UTM tracking,
So that I can attribute revenue to specific articles and prove content ROI.

**Acceptance Criteria:**

**Given** I have connected e-commerce stores (Story 7.1) and published articles with UTM parameters (Story 7.5)
**When** an order is placed in the e-commerce store
**Then** the system:
  - Receives order webhook from Shopify/WooCommerce
  - Extracts UTM parameters from order data (if available)
  - Matches UTM parameters to articles:
    - `utm_campaign=article_{article_id}` → Matches to article
    - `utm_content=product_{product_id}` → Matches to product link
  - Creates attribution record linking order to article
  - Calculates revenue attributed (order total or product-specific revenue)
**And** order matching happens automatically (no user action required)
**And** matching is processed via Inngest worker (async)

**Given** an order is matched to an article
**When** attribution is created
**Then** the system stores:
  - Order ID (from e-commerce platform)
  - Article ID (matched article)
  - Product ID (if product link was clicked)
  - Order total (revenue amount)
  - Order date and time
  - UTM parameters (for reference)
  - Attribution confidence (high, medium, low based on UTM match quality)
**And** attribution record is stored in `revenue_attribution` table
**And** article revenue is updated (cumulative revenue per article)

**Given** order matching occurs
**When** UTM parameters are present in order data
**Then** matching accuracy is high:
  - Direct UTM match: High confidence (utm_campaign matches article_id)
  - Product link match: High confidence (utm_content matches product_id)
  - Partial match: Medium confidence (some UTM parameters match)
**And** matching accuracy target: 80%+ (PRD validation target)
**And** unmatched orders are logged for analysis

**Given** order matching fails or UTM parameters are missing
**When** an order cannot be matched
**Then** the system:
  - Logs the order (unmatched orders table)
  - Attempts alternative matching (if configured):
    - Time-based attribution (orders within 7-day window of article publish)
    - Referrer-based attribution (if referrer URL matches article URL)
  - Marks order as "Unmatched" with reason
**And** unmatched orders are visible in attribution reports
**And** I can manually match orders if needed

**Given** I want to configure attribution settings
**When** I view attribution settings
**Then** I can configure:
  - Attribution window (7 days, 30 days, custom)
  - Attribution method (first-touch, last-touch, multi-touch)
  - Order matching rules (strict UTM match, flexible matching)
  - Revenue calculation (order total, product-specific, margin)
**And** settings are saved and applied to all attribution calculations

**Given** order matching is working
**When** I view article analytics
**Then** I can see:
  - Orders attributed to the article
  - Revenue attributed to the article
  - Attribution accuracy (matched vs. unmatched orders)
  - Top products sold via article links
**And** I can see detailed attribution data (Story 7.7)

**Technical Notes:**
- Order webhooks: Shopify order/created webhook, WooCommerce order webhook
- UTM extraction: From order data (UTM parameters stored by e-commerce platform)
- Order matching: UTM parameter matching to articles
- Attribution storage: `revenue_attribution` table with order_id, article_id, revenue, timestamp
- Matching accuracy: 80%+ target (PRD validation)
- Alternative matching: Time-based, referrer-based fallback options

---

### Story 7.7: Revenue Attribution Reports and Dashboard

**Priority:** P1 (Post-MVP - Advanced feature, not core promise)

As a user,
I want to view revenue attribution reports showing which articles drove sales,
So that I can prove content ROI and optimize my content strategy.

**Acceptance Criteria:**

**Given** I have articles with revenue attribution data (Story 7.6)
**When** I view "Revenue Attribution" in Analytics
**Then** I see a revenue attribution dashboard with:
  - **Total Revenue Attributed:** "$12,450 attributed this month"
  - **Top Performing Articles:**
    - Article title
    - Revenue attributed
    - Orders attributed
    - Conversion rate
    - Revenue per article
  - **Revenue Trends:** Chart showing revenue over time
  - **Attribution Breakdown:**
    - Revenue by article
    - Revenue by product
    - Revenue by store (if multiple stores)
**And** metrics are displayed prominently
**And** I can filter by date range, store, article, product

**Given** I want to see detailed article attribution
**When** I click on an article in the revenue attribution dashboard
**Then** I see detailed attribution data:
  - **Article Performance:**
    - Total revenue attributed: "$3,200"
    - Total orders attributed: "12 orders"
    - Average order value: "$267"
    - Conversion rate: "2.1%"
  - **Order Details:**
    - List of orders attributed to this article
    - Order ID, date, total, products
    - UTM parameters used
    - Attribution confidence
  - **Product Performance:**
    - Products sold via this article
    - Revenue per product
    - Top products
  - **Trends:**
    - Revenue over time
    - Orders over time
    - Conversion rate trends
**And** I can export this data (CSV, PDF)

**Given** I want to see attribution by product
**When** I view "Product Attribution"
**Then** I see:
  - Products with revenue attribution
  - Revenue per product
  - Articles driving product sales
  - Product conversion rates
**And** I can identify which products benefit most from content
**And** I can see which articles drive sales for specific products

**Given** I want to generate an attribution report
**When** I click "Generate Report" in Revenue Attribution
**Then** I can configure report options:
  - Date range (last 7 days, 30 days, 90 days, custom)
  - Scope (all articles, specific articles, by store, by product)
  - Include metrics (revenue, orders, conversion rates, trends)
  - Format (PDF, Excel, PowerPoint, Shareable Link)
**And** I can preview the report before generating

**Given** I generate an attribution report
**When** the report is created
**Then** the report includes:
  - **Executive Summary:**
    - Total revenue attributed
    - Total orders attributed
    - Average order value
    - Top performing articles
  - **Article Performance:**
    - Revenue per article
    - Orders per article
    - Conversion rates
    - ROI calculations
  - **Product Performance:**
    - Revenue per product
    - Top products
    - Product-article relationships
  - **Visualizations:**
    - Revenue trends charts
    - Article performance charts
    - Product performance charts
**And** report is professionally formatted
**And** report is branded (organization logo, colors)

**Given** I want to share attribution reports
**When** I generate a report
**Then** I can:
  - Download report (PDF, Excel, PowerPoint)
  - Share report via link (password-protected, optional)
  - Email report to stakeholders
  - Schedule automatic report generation (weekly, monthly)
**And** shared reports are accessible via secure link
**And** I can set link expiration

**Given** I want to see attribution accuracy
**When** I view revenue attribution
**Then** I can see:
  - Attribution accuracy: "85% of orders matched"
  - Matched orders count
  - Unmatched orders count
  - Attribution confidence distribution (high, medium, low)
**And** I can investigate unmatched orders
**And** I can improve attribution accuracy by adjusting settings

**Technical Notes:**
- Attribution dashboard: Real-time data from `revenue_attribution` table
- Report generation: Server-side rendering (PDF, Excel, PowerPoint)
- Attribution accuracy: Calculated as (matched orders / total orders) × 100
- Data aggregation: Revenue, orders, conversion rates calculated from attribution data
- Report sharing: Secure, password-protected links (optional)

---

### Story 7.8: Revenue Attribution Data Export

**Priority:** P1 (Post-MVP - Advanced feature, not core promise)

As a user,
I want to export revenue attribution data for stakeholder reporting,
So that I can share ROI proof with executives, clients, or investors.

**Acceptance Criteria:**

**Given** I have revenue attribution data (Story 7.7)
**When** I view Revenue Attribution
**Then** I can click "Export Data"
**And** I can select export format:
  - CSV (spreadsheet format)
  - Excel (formatted Excel file)
  - PDF (formatted report)
  - JSON (raw data format)
**And** I can select what to export:
  - All attribution data
  - Specific date range
  - Specific articles
  - Specific products
  - Specific stores

**Given** I select "Export as CSV"
**When** export is generated
**Then** I receive a CSV file with columns:
  - Article ID, Article Title
  - Order ID, Order Date, Order Total
  - Product ID, Product Name, Product Revenue
  - UTM Parameters
  - Attribution Confidence
  - Store Name
**And** CSV is properly formatted (comma-separated, headers included)
**And** CSV can be opened in Excel, Google Sheets, or any spreadsheet tool

**Given** I select "Export as Excel"
**When** export is generated
**Then** I receive an Excel file with:
  - Formatted spreadsheet with headers
  - Multiple sheets (if applicable):
    - Summary sheet (aggregated data)
    - Detailed sheet (order-level data)
    - Article performance sheet
    - Product performance sheet
  - Charts and visualizations (if applicable)
  - Branded formatting (organization logo, colors)
**And** Excel file is professionally formatted
**And** Excel can be opened in Microsoft Excel or Google Sheets

**Given** I select "Export as PDF"
**When** export is generated
**Then** I receive a PDF report with:
  - Executive summary
  - Detailed attribution data
  - Charts and visualizations
  - Professional formatting
  - Branded design (organization logo, colors)
**And** PDF is suitable for stakeholder presentations
**And** PDF can be shared via email or printed

**Given** I want to schedule automatic exports
**When** I configure export settings
**Then** I can:
  - Schedule weekly exports (email to specified recipients)
  - Schedule monthly exports (email to specified recipients)
  - Set export format and scope
  - Add custom recipients
**And** scheduled exports run automatically via Inngest cron jobs
**And** I receive notifications when exports are generated

**Given** I export attribution data
**When** export is generated
**Then** I can:
  - Download the file immediately
  - Receive email with download link
  - Access file from "Exports" section (stored for 30 days)
**And** export is stored securely
**And** I can re-download exports within 30 days

**Technical Notes:**
- Export formats: CSV, Excel, PDF, JSON
- Export processing: Via Inngest workers (async for large exports)
- Export storage: Cloudflare R2 or Supabase Storage (30-day retention)
- Scheduled exports: Inngest cron jobs for automatic generation
- Data formatting: Professional formatting for stakeholder reports

---

### Story 7.9: Multiple E-Commerce Store Management

**Priority:** P1 (Post-MVP - Advanced feature, not core promise)

As a user,
I want to manage multiple e-commerce stores per organization,
So that I can track attribution across all my stores or manage stores for multiple clients (agencies).

**Acceptance Criteria:**

**Given** I am an organization owner
**When** I view E-Commerce Stores
**Then** I can see all connected stores
**And** I can connect additional stores (up to plan limit)
**And** each store is independent:
  - Separate product catalogs
  - Separate order tracking
  - Separate attribution data
**And** I can see store count: "3 stores connected"

**Given** I have multiple stores
**When** I view store management
**Then** I can:
  - See all stores in a list
  - Filter stores by platform (Shopify, WooCommerce)
  - See store status (Connected, Error, Expired)
  - See product count per store
  - See revenue attribution per store
**And** I can manage each store independently

**Given** I want to set a default store
**When** I configure store settings
**Then** I can set a default store for:
  - Product operations (if store not specified)
  - Attribution reporting (aggregate across all or focus on default)
  - Product linking in articles (prefer products from default store)
**And** default store is saved to preferences
**And** I can change default store at any time

**Given** I am an agency user
**When** I manage stores for clients
**Then** I can:
  - Connect stores for different clients
  - Tag stores with client names
  - View attribution per client (per store)
  - Generate client-specific attribution reports
**And** stores are organized by client
**And** client data is isolated (multi-tenant - Epic 8)

**Given** I want to see aggregated attribution
**When** I view revenue attribution
**Then** I can:
  - View attribution across all stores (aggregated)
  - View attribution per store (filtered)
  - Compare stores (side-by-side comparison)
  - See store performance rankings
**And** aggregated data shows total revenue across all stores
**And** per-store data shows individual store performance

**Given** I want to manage store connections
**When** I view stores
**Then** I can:
  - Add new stores (connect additional stores)
  - Edit store settings (name, tags, sync frequency)
  - Test store connections
  - Disconnect stores (remove connection, preserve historical data)
  - Reconnect stores (if connection expired)
**And** store management is intuitive
**And** I can see connection history

**Given** I have reached my store limit
**When** I try to connect an additional store
**Then** I see a message: "You've reached your store limit. Upgrade your plan to connect more stores."
**And** I see my current plan limit and usage
**And** I see an "Upgrade Plan" button
**And** connection is blocked until plan is upgraded

**Technical Notes:**
- Multiple stores: Stored in `ecommerce_stores` table with organization_id
- Store limits: Enforced per plan tier (Starter: 1 store, Pro: 3 stores, Agency: 10+ stores)
- Store isolation: Each store has separate product catalog and attribution data
- Default store: User preference stored in `user_preferences` or `organizations.default_store_id`
- Agency multi-client: Stores tagged with client_id for client-specific management

---

### Epic 8: White-Label & Multi-Client Management
**User Outcome:** Agency users can configure white-label branding, set up custom domains, manage multiple clients, and provide client portals.

**FRs covered:** FR78-FR84

**Key Capabilities:**
- Configure white-label branding (logo, colors, fonts) - Agency plan only
- Set up custom domains for white-label portals
- Invite client stakeholders to white-label portals
- Client portal access with read-only permissions
- Multi-tenant data isolation (reinforcement)
- Manage multiple projects (content collections)
- Assign projects to specific team members or clients

**Dependencies:** Epic 1 (requires multi-tenant foundation), Epic 2 (requires dashboard for client portals)

**Strategic Priority:** **HIGH** - Build after Revenue Attribution is proven. Agency segment represents 10% of customers but 21% of revenue with higher ARPU ($299-$399). White-label creates lock-in and enables reseller model.

**Success Metrics:**
- 50%+ of agencies use white-label within 3 months
- Custom domain setup in < 5 minutes
- Zero "Infin8Content" branding visible in client portals

### Story 8.1: White-Label Branding Configuration (Logo, Colors, Fonts)

**Priority:** P1 (Post-MVP - Agency feature, not core promise)

As an organization owner (Agency plan),
I want to configure white-label branding (logo, colors, fonts),
So that I can rebrand the platform as my own product for client reselling.

**Acceptance Criteria:**

**Given** I am an organization owner on the Agency plan
**When** I navigate to Settings > White-Label > Branding
**Then** I can configure white-label branding:
  - **Logo:** Upload logo image (PNG, SVG, recommended size: 200x50px)
  - **Colors:**
    - Primary color (brand color, used for buttons, links)
    - Secondary color (accent color)
    - Background color (optional)
    - Text color (optional)
  - **Fonts:** Select from 50+ Google Fonts
    - Heading font (for titles, headings)
    - Body font (for content, paragraphs)
  - **Favicon:** Upload favicon (16x16px or 32x32px)
**And** I can preview branding changes in real-time
**And** I can save branding configuration

**Given** I configure white-label branding
**When** I save branding settings
**Then** branding is stored in `organizations.white_label_settings` JSONB column
**And** branding is applied to:
  - Dashboard header and navigation
  - All pages and components
  - Email notifications (if configured)
  - PDF reports and exports
  - Client portals (if enabled)
**And** "Infin8Content" branding is hidden/replaced with my branding
**And** I see a preview of the branded interface

**Given** I want to test branding
**When** I view the preview
**Then** I can see:
  - Logo displayed in header
  - Colors applied to buttons, links, accents
  - Fonts applied to headings and body text
  - Favicon displayed in browser tab
**And** preview updates in real-time as I make changes
**And** I can toggle between branded and default view

**Given** I have configured branding
**When** team members or clients access the platform
**Then** they see the white-label branding (not Infin8Content branding)
**And** all UI elements use the configured colors and fonts
**And** logo appears in header and reports
**And** branding is consistent across all pages

**Given** I want to reset branding
**When** I view branding settings
**Then** I can click "Reset to Default"
**And** branding reverts to Infin8Content default
**And** I see a confirmation before resetting
**And** reset takes effect immediately

**Technical Notes:**
- Branding storage: `organizations.white_label_settings` JSONB column
- Logo storage: Cloudflare R2 or Supabase Storage
- Color application: CSS variables or theme provider (runtime theming)
- Font loading: Google Fonts API integration
- Branding scope: Applied to all UI components, emails, reports, client portals

---

### Story 8.2: Custom Domain Setup with SSL Provisioning

**Priority:** P1 (Post-MVP - Agency feature, not core promise)

As an organization owner (Agency plan),
I want to set up a custom domain for my white-label portal,
So that clients access the platform via my branded domain instead of infin8content.com.

**Acceptance Criteria:**

**Given** I am an organization owner on the Agency plan
**When** I navigate to Settings > White-Label > Custom Domain
**Then** I can configure a custom domain:
  - Enter custom domain (e.g., content.myagency.com or mycontent.com)
  - Choose domain type:
    - Subdomain (content.myagency.com)
    - Full custom domain (mycontent.com)
**And** I see setup instructions:
  - CNAME record configuration
  - DNS provider instructions
  - SSL certificate information
**And** I can start the domain setup process

**Given** I enter a custom domain
**When** I click "Setup Domain"
**Then** the system:
  - Validates domain format
  - Generates CNAME record value (e.g., cname.infin8content.com)
  - Provides DNS configuration instructions
  - Creates domain verification record
**And** I see step-by-step setup instructions
**And** I can copy CNAME record value to clipboard

**Given** I configure DNS (CNAME record)
**When** DNS is configured correctly
**Then** the system:
  - Verifies DNS configuration (checks CNAME record)
  - Provisions SSL certificate automatically (Let's Encrypt or similar)
  - Configures domain routing
  - Activates custom domain
**And** domain setup completes in < 5 minutes (NFR target)
**And** I see "Domain active" status

**Given** custom domain is active
**When** users access the custom domain
**Then** they see:
  - White-label branding (from Story 8.1)
  - Platform accessible via custom domain
  - SSL certificate valid (HTTPS)
  - No "Infin8Content" branding visible
**And** custom domain works for all platform features
**And** redirects from infin8content.com to custom domain (optional)

**Given** domain setup fails
**When** DNS configuration is incorrect or incomplete
**Then** I see clear error messages:
  - "CNAME record not found" (if DNS not configured)
  - "CNAME record points to wrong value" (if misconfigured)
  - "Domain verification failed" (if verification record missing)
**And** I see troubleshooting steps
**And** I can retry domain verification
**And** setup process can be resumed

**Given** I want to manage custom domain
**When** I view custom domain settings
**Then** I can:
  - See domain status (Active, Pending, Failed)
  - View SSL certificate status and expiration
  - Update domain (change to different domain)
  - Remove custom domain (revert to infin8content.com)
**And** domain changes take effect within minutes
**And** I can see domain history (when activated, last verified)

**Technical Notes:**
- Custom domain: CNAME record pointing to Infin8Content infrastructure
- SSL provisioning: Automatic via Let's Encrypt or similar (certbot)
- Domain verification: DNS TXT record or CNAME verification
- Domain routing: Middleware handles custom domain routing (Next.js middleware)
- SSL renewal: Automatic renewal before expiration

---

### Story 8.3: Client Stakeholder Invitations to White-Label Portals

**Priority:** P1 (Post-MVP - Agency feature, not core promise)

As an organization owner (Agency plan),
I want to invite client stakeholders to white-label portals,
So that clients can access their content and reports through my branded portal.

**Acceptance Criteria:**

**Given** I am an organization owner on the Agency plan
**When** I navigate to Settings > White-Label > Client Portals
**Then** I can invite client stakeholders:
  - Click "Invite Client"
  - Enter client email address
  - Enter client name (optional)
  - Select client project (if multiple projects)
  - Set access level (Viewer - read-only)
  - Add custom message (optional)
**And** I can send invitation

**Given** I send a client invitation
**When** invitation is sent
**Then** the system:
  - Creates client user account (if not exists)
  - Sends invitation email to client
  - Email is branded (white-label branding, custom FROM address)
  - Email includes invitation link
  - Client is assigned "Viewer" role (read-only access)
**And** invitation is stored in `client_invitations` table
**And** I can see invitation status (Pending, Accepted, Expired)

**Given** a client receives an invitation
**When** client clicks invitation link
**Then** client is directed to:
  - White-label portal (custom domain if configured)
  - Account setup page (if new client)
  - Login page (if existing client)
**And** client sees white-label branding (not Infin8Content)
**And** client can complete account setup or login

**Given** client accepts invitation
**When** client completes account setup
**Then** client account is activated
**And** client has access to:
  - Client portal dashboard (read-only)
  - Their project's articles and content
  - Analytics and reports (their project only)
  - Revenue attribution (if applicable)
**And** client cannot:
  - Create or edit articles
  - Manage settings
  - Access other clients' data
  - See agency-level settings
**And** data isolation is enforced (Story 8.5)

**Given** I want to manage client invitations
**When** I view Client Portals
**Then** I can see:
  - List of invited clients
  - Invitation status (Pending, Accepted, Expired)
  - Client access level
  - Last accessed date
  - Quick actions: "Resend Invitation", "Revoke Access", "Edit Access"
**And** I can resend expired invitations
**And** I can revoke client access

**Given** I want to customize invitation email
**When** I send an invitation
**Then** I can:
  - Add custom message to invitation
  - Use email template (if configured)
  - Include client-specific information
**And** email is branded with white-label branding
**And** email FROM address uses custom domain (if configured)

**Technical Notes:**
- Client invitations: Stored in `client_invitations` table
- Client accounts: Created with "Viewer" role (read-only)
- Email branding: White-label branding applied to invitation emails
- Access control: Role-based access control (RBAC) enforces read-only access
- Data isolation: Client sees only their assigned project's data

---

### Story 8.4: Client Portal Access with Read-Only Permissions

**Priority:** P1 (Post-MVP - Agency feature, not core promise)

As a client stakeholder,
I want to access the white-label portal with read-only permissions,
So that I can view my content performance and reports without modifying anything.

**Acceptance Criteria:**

**Given** I am a client stakeholder with accepted invitation (Story 8.3)
**When** I log in to the client portal
**Then** I see:
  - White-label branding (agency's logo, colors, fonts)
  - Custom domain (if configured by agency)
  - Client portal dashboard (read-only view)
  - My assigned project's content
**And** I never see "Infin8Content" branding
**And** portal looks like the agency's own product

**Given** I access the client portal
**When** I view the dashboard
**Then** I can see:
  - **Content Overview:**
    - Articles in my project
    - Published articles count
    - Content performance summary
  - **Analytics:**
    - Views, rankings, conversions (my project only)
    - Revenue attribution (if applicable, my project only)
    - Performance trends
  - **Reports:**
    - Access to attribution reports (read-only)
    - Export reports (PDF, Excel)
**And** I cannot edit or modify any content
**And** I cannot access other clients' data

**Given** I view articles in the client portal
**When** I browse articles
**Then** I can:
  - View article list (my project's articles only)
  - View article details (read-only)
  - See article performance metrics
  - Export articles (if permitted)
**And** I cannot:
  - Edit articles
  - Delete articles
  - Create new articles
  - Publish articles
**And** edit/delete buttons are hidden or disabled

**Given** I view analytics in the client portal
**When** I access analytics
**Then** I can see:
  - Article performance (my project only)
  - Keyword rankings (my project only)
  - Revenue attribution (my project only, if applicable)
  - Content quality metrics (my project only)
**And** I can filter and export analytics data
**And** I cannot see other clients' analytics
**And** I cannot modify analytics settings

**Given** I want to export reports
**When** I view reports in the client portal
**Then** I can:
  - View attribution reports (read-only)
  - Export reports (PDF, Excel, if permitted by agency)
  - Share reports via link (if permitted)
**And** exported reports are branded (agency's branding)
**And** reports show only my project's data

**Given** I try to access restricted features
**When** I attempt to edit content or access settings
**Then** I see:
  - Error message: "You don't have permission to perform this action"
  - Or feature is hidden/disabled
**And** I cannot bypass permissions
**And** read-only access is enforced at API level (not just UI)

**Given** I want to see my account information
**When** I view account settings
**Then** I can see:
  - My profile information
  - My assigned project
  - Access level (Viewer)
  - Account activity (if available)
**And** I cannot modify account settings
**And** I cannot change my role or permissions

**Technical Notes:**
- Client portal: White-label branded interface, custom domain support
- Read-only access: Enforced via RBAC (Viewer role)
- Data isolation: Client sees only assigned project's data (Story 8.5)
- API-level enforcement: Permissions checked at API level, not just UI
- Branding: White-label branding applied to all client portal pages

---

### Story 8.5: Multi-Tenant Data Isolation (Row-Level Security)

**Priority:** P1 (Post-MVP - Agency feature, not core promise)

As the system,
I want to isolate data per organization using row-level security,
So that organizations cannot access each other's data (zero cross-organization data leakage).

**Acceptance Criteria:**

**Given** the system stores data for multiple organizations
**When** data is stored in database tables
**Then** all tables have:
  - `organization_id` column (foreign key to organizations table)
  - Row-level security (RLS) policies enabled
  - RLS policies enforce: `organization_id = current_user_org_id()`
**And** data is isolated by organization
**And** cross-organization data access is prevented

**Given** a user queries data
**When** user makes a database query
**Then** RLS policies automatically filter results:
  - Only rows where `organization_id` matches user's organization
  - Other organizations' data is invisible
  - No manual filtering required in application code
**And** data isolation is enforced at database level
**And** zero cross-organization data leakage (NFR-S5)

**Given** a user tries to access another organization's data
**When** user attempts to access data by ID or other means
**Then** RLS policies prevent access:
  - Query returns empty result (if row belongs to different organization)
  - Or query fails with permission error
**And** user cannot bypass RLS by manipulating queries
**And** data isolation is guaranteed

**Given** the system handles multi-tenant operations
**When** operations are performed
**Then** `organization_id` is automatically set:
  - From authenticated user's organization
  - From current session context
  - Cannot be overridden by user input
**And** all data operations include organization context
**And** data is always associated with correct organization

**Given** I want to verify data isolation
**When** I test the system
**Then** I can verify:
  - Organization A cannot see Organization B's articles
  - Organization A cannot see Organization B's clients
  - Organization A cannot see Organization B's analytics
  - Organization A cannot access Organization B's settings
**And** isolation is tested and verified
**And** zero data leakage is confirmed

**Given** the system handles client portals (Story 8.4)
**When** a client stakeholder accesses data
**Then** additional filtering is applied:
  - Client sees only their assigned project's data
  - Project-level RLS policies enforce project isolation
  - Client cannot see other clients' data (even within same organization)
**And** multi-level isolation is enforced (organization → project → client)

**Technical Notes:**
- Row-level security: PostgreSQL RLS policies on all tables
- Organization isolation: `organization_id` column + RLS policies
- Project isolation: Additional `project_id` filtering for client portals
- Current user context: `current_user_org_id()` function returns user's organization
- Zero leakage: NFR-S5 requirement, enforced at database level

---

### Story 8.6: Project Management and Organization

**Priority:** P1 (Post-MVP - Agency feature, not core promise)

As an organization owner,
I want to manage multiple projects (content collections),
So that I can organize content by client, campaign, or initiative.

**Acceptance Criteria:**

**Given** I am an organization owner
**When** I navigate to Projects
**Then** I can see all my projects with:
  - Project name
  - Project description
  - Article count
  - Client assignment (if applicable)
  - Team member assignments
  - Created date
  - Last updated date
**And** I can create, edit, and delete projects

**Given** I want to create a new project
**When** I click "Create Project"
**Then** I can configure:
  - Project name (e.g., "Q1 Content Campaign", "Client ABC Blog")
  - Project description (optional)
  - Client assignment (if managing clients)
  - Default settings (writing style, CMS connection, etc.)
**And** I can save the project
**And** project is created and available immediately

**Given** I have multiple projects
**When** I view projects
**Then** I can:
  - Filter projects by client (for agencies)
  - Filter projects by status (active, archived)
  - Search projects by name
  - Sort projects (by name, date, article count)
**And** I can see project statistics (articles, performance, etc.)
**And** I can manage projects efficiently

**Given** I want to organize content by project
**When** I create or edit an article
**Then** I can assign the article to a project:
  - Select project from dropdown
  - Or create new project from article editor
  - Or leave unassigned (default project)
**And** article is associated with the project
**And** I can filter articles by project

**Given** I view a project
**When** I open a project
**Then** I can see:
  - Project overview (description, settings)
  - Articles in this project
  - Project performance (aggregated analytics)
  - Team members assigned to project
  - Client access (if client portal enabled)
**And** I can manage project settings
**And** I can view project-specific analytics

**Given** I want to assign projects to team members
**When** I view project settings
**Then** I can:
  - Assign team members to project
  - Set project permissions (Editor, Viewer)
  - Remove team members from project
**And** team members see only their assigned projects
**And** project assignments are saved

**Given** I want to assign projects to clients
**When** I configure client portal (Story 8.3)
**Then** I can:
  - Assign project to client (client sees only this project)
  - Change project assignment (reassign to different project)
  - Remove project assignment (revoke client access)
**And** client sees only their assigned project's data
**And** project-level isolation is enforced

**Technical Notes:**
- Projects: Stored in `projects` table with `organization_id`
- Project assignments: `project_assignments` table (user_id, project_id, role)
- Client assignments: Projects assigned to clients for portal access
- Article-project relationship: `articles.project_id` foreign key
- Project isolation: RLS policies enforce project-level access control

---

### Story 8.7: Project Assignment to Team Members and Clients

**Priority:** P1 (Post-MVP - Agency feature, not core promise)

As an organization owner,
I want to assign projects to specific team members or clients,
So that I can control who has access to which content and reports.

**Acceptance Criteria:**

**Given** I have projects and team members
**When** I view a project's settings
**Then** I can see:
  - Team members assigned to this project
  - Clients assigned to this project (if applicable)
  - Access levels (Editor, Viewer)
  - Assignment dates
**And** I can manage assignments

**Given** I want to assign a project to a team member
**When** I click "Assign Team Member"
**Then** I can:
  - Select team member from list
  - Set access level (Editor: can edit, Viewer: read-only)
  - Add assignment notes (optional)
**And** I can save the assignment
**And** team member receives notification (if configured)
**And** team member can now access the project

**Given** a team member is assigned to a project
**When** team member logs in
**Then** team member can see:
  - Assigned projects in project list
  - Articles in assigned projects
  - Project-specific analytics
  - Project settings (if Editor role)
**And** team member cannot see unassigned projects
**And** access is enforced by RLS policies

**Given** I want to assign a project to a client
**When** I configure client portal (Story 8.3)
**Then** I can:
  - Select project to assign
  - Assign to existing client or create new client invitation
  - Set client access (always Viewer/read-only for clients)
**And** client receives invitation (if new)
**And** client can access project in client portal

**Given** a client is assigned to a project
**When** client accesses client portal (Story 8.4)
**Then** client can see:
  - Assigned project in portal
  - Articles in assigned project (read-only)
  - Analytics for assigned project (read-only)
  - Reports for assigned project (read-only)
**And** client cannot see other projects
**And** client cannot see other clients' projects
**And** project-level isolation is enforced

**Given** I want to manage assignments
**When** I view project assignments
**Then** I can:
  - Remove team member from project
  - Change team member's access level
  - Remove client from project
  - Reassign project to different client
**And** changes take effect immediately
**And** removed users lose access to project

**Given** I want to see assignment overview
**When** I view "Project Assignments" or "Team Management"
**Then** I can see:
  - All projects and their assignments
  - Team members and their assigned projects
  - Clients and their assigned projects
  - Access levels per assignment
**And** I can manage all assignments from one place
**And** I can see assignment history (if tracked)

**Technical Notes:**
- Project assignments: `project_assignments` table (user_id, project_id, role, assigned_at)
- Client assignments: Projects assigned to clients via `client_projects` table
- Access levels: Editor (can edit), Viewer (read-only)
- Assignment enforcement: RLS policies filter by project assignments
- Notification: Optional notifications when assignments are made/changed

---

### Epic 9: Team Collaboration & Workflow
**User Outcome:** Teams can collaborate on content with comments, approvals, assignments, and status tracking.

**FRs covered:** FR112-FR117

**Key Capabilities:**
- Team members can comment on articles before publishing
- Organization owners can approve articles before publishing
- Assign articles to team members
- Manage article ownership and permissions
- Track article status (draft, in-review, approved, published)
- Notify users of article status changes

**Dependencies:** Epic 1 (requires team member foundation), Epic 4B (requires articles to collaborate on)

**Success Metrics:**
- 100% of status changes trigger notifications
- Average approval time < 24 hours

### Story 9.1: Article Comments and Collaboration

**Priority:** P1 (Post-MVP - Collaboration, not required for MVP)

As a team member,
I want to comment on articles before publishing,
So that I can provide feedback and collaborate with my team on content.

**Acceptance Criteria:**

**Given** I am viewing an article in the editor
**When** I want to add a comment
**Then** I can:
  - Click "Add Comment" or select text and click "Comment"
  - Enter comment text
  - Mention team members (@username)
  - Attach files or images (optional)
  - Save comment
**And** comment is added to the article
**And** mentioned team members receive notifications

**Given** I add a comment to an article
**When** comment is saved
**Then** the comment appears:
  - In the comments panel (right sidebar or bottom panel)
  - With my name and avatar
  - With timestamp
  - With comment text
  - With any attachments
**And** comment is stored in `article_comments` table
**And** comment is associated with the article and section (if section-specific)

**Given** I want to comment on a specific section
**When** I select text in a section
**Then** I can click "Comment on Selection"
**And** comment is linked to that specific section
**And** comment appears with section context
**And** section is highlighted when viewing the comment

**Given** there are comments on an article
**When** I view the article
**Then** I can see:
  - Comment count badge (e.g., "3 comments")
  - Comments panel with all comments
  - Comment threads (replies to comments)
  - Comment status (resolved, unresolved)
**And** I can filter comments (all, unresolved, resolved, by author)
**And** I can navigate to comments from the article

**Given** I want to reply to a comment
**When** I view a comment
**Then** I can click "Reply"
**And** I can enter a reply
**And** reply is threaded under the original comment
**And** original commenter receives notification

**Given** I want to resolve a comment
**When** I view a comment
**Then** I can click "Resolve" or "Mark as Resolved"
**And** comment is marked as resolved
**And** comment is hidden from active comments (unless "Show Resolved" is enabled)
**And** commenter receives notification that comment was resolved

**Given** I am mentioned in a comment
**When** someone mentions me (@username)
**Then** I receive a notification:
  - In-app notification (notification bell)
  - Email notification (if configured)
  - Notification includes comment text and article link
**And** I can click notification to view the comment
**And** notification is marked as read when I view it

**Technical Notes:**
- Comments: Stored in `article_comments` table with article_id, user_id, section_id (optional)
- Comment threading: Parent comment_id for replies
- Mentions: @username parsing and notification triggering
- Notifications: In-app and email notifications for mentions and replies
- Comment resolution: Status field (resolved/unresolved) for tracking

---

### Story 9.2: Article Approval Workflow

**Priority:** P1 (Post-MVP - Collaboration, not required for MVP)

As an organization owner,
I want to approve articles before publishing,
So that I can review and control content quality before it goes live.

**Acceptance Criteria:**

**Given** I am an organization owner
**When** I configure approval settings
**Then** I can enable/disable approval workflow:
  - Require approval for all articles
  - Require approval for specific projects only
  - No approval required (articles can be published directly)
**And** approval settings are saved
**And** settings apply to all team members

**Given** approval workflow is enabled
**When** a team member creates or edits an article
**Then** the article status can be:
  - "Draft" (not ready for review)
  - "In Review" (submitted for approval)
  - "Approved" (approved, ready to publish)
  - "Rejected" (needs changes)
  - "Published" (already published)
**And** status is visible in article list and editor
**And** status changes trigger notifications

**Given** a team member submits an article for approval
**When** they click "Submit for Approval"
**Then** article status changes to "In Review"
**And** organization owner receives notification:
  - "Article '[Title]' submitted for approval"
  - Notification includes article link
  - Notification includes submitter name
**And** article appears in "Pending Approval" queue
**And** team member sees "Awaiting Approval" status

**Given** I am an organization owner
**When** I view "Pending Approval" queue
**Then** I can see:
  - List of articles awaiting approval
  - Article title and author
  - Submitted date
  - Time in review
  - Quick preview of article
**And** I can:
  - Click to view full article
  - Approve article
  - Reject article (with feedback)
  - Request changes (with comments)

**Given** I approve an article
**When** I click "Approve"
**Then** article status changes to "Approved"
**And** article author receives notification: "Article '[Title]' has been approved"
**And** article can now be published (status allows publishing)
**And** approval is logged (who approved, when)

**Given** I reject an article
**When** I click "Reject"
**Then** I can provide rejection feedback:
  - Reason for rejection (required)
  - Specific comments or suggestions
  - Areas that need improvement
**And** article status changes to "Rejected"
**And** article author receives notification with rejection feedback
**And** article can be edited and resubmitted

**Given** I request changes
**When** I click "Request Changes"
**Then** I can add comments specifying what needs to change
**And** article status remains "In Review" (or changes to "Changes Requested")
**And** article author receives notification with change requests
**And** author can make changes and resubmit

**Given** approval workflow is configured
**When** a team member tries to publish an article
**Then** if article is not approved:
  - Publishing is blocked
  - Message: "This article requires approval before publishing"
  - Option to submit for approval
**And** if article is approved:
  - Publishing proceeds normally
  - Article can be published

**Technical Notes:**
- Approval workflow: Configurable per organization or project
- Article status: Status field in `articles` table (draft, in-review, approved, rejected, published)
- Approval queue: Filtered view of articles with status "in-review"
- Notifications: In-app and email notifications for status changes
- Approval logging: `article_approvals` table tracks approval history

---

### Story 9.3: Article Assignment to Team Members

As an organization owner or team lead,
I want to assign articles to team members,
So that I can distribute work and track who is responsible for each article.

**Acceptance Criteria:**

**Given** I am an organization owner or team lead
**When** I view an article
**Then** I can see:
  - Current assignee (if assigned)
  - "Unassigned" status (if not assigned)
  - Assignment date (if assigned)
**And** I can change assignment or assign if unassigned

**Given** I want to assign an article
**When** I click "Assign" or "Change Assignee"
**Then** I can:
  - Select team member from dropdown (list of organization members)
  - Add assignment notes (optional, e.g., "Focus on SEO optimization")
  - Set due date (optional)
  - Save assignment
**And** assignment is saved
**And** assigned team member receives notification

**Given** an article is assigned to me
**When** I receive assignment notification
**Then** I see:
  - Notification: "Article '[Title]' assigned to you"
  - Article link in notification
  - Assignment notes (if provided)
  - Due date (if set)
**And** I can click to view the article
**And** article appears in "My Assigned Articles" view

**Given** I want to see my assigned articles
**When** I view "My Articles" or filter by "Assigned to Me"
**Then** I can see:
  - List of articles assigned to me
  - Article status
  - Due dates (if set)
  - Assignment date
  - Quick actions: "View", "Edit", "Unassign"
**And** I can filter by status, due date, project
**And** I can see overdue articles (highlighted)

**Given** I want to see all assignments
**When** I view "Article Assignments" (as owner/lead)
**Then** I can see:
  - All articles and their assignees
  - Unassigned articles
  - Assignment overview (who has how many articles)
  - Workload distribution
**And** I can reassign articles
**And** I can see assignment history

**Given** I want to unassign an article
**When** I view an assigned article
**Then** I can click "Unassign"
**And** article becomes unassigned
**And** previous assignee receives notification (optional)
**And** article can be reassigned

**Given** I want to set assignment due dates
**When** I assign an article
**Then** I can set a due date
**And** due date is displayed on the article
**And** assignee receives reminder notifications (if configured)
**And** overdue articles are highlighted

**Technical Notes:**
- Article assignment: `articles.assigned_to_user_id` foreign key
- Assignment tracking: `article_assignments` table (optional, for history)
- Notifications: In-app and email notifications for assignments
- Assignment views: Filtered views for "My Assigned Articles"
- Due dates: Optional due_date field for assignment deadlines

---

### Story 9.4: Article Ownership and Permissions Management

**Priority:** P1 (Post-MVP - Collaboration, not required for MVP)

As an organization owner,
I want to manage article ownership and permissions,
So that I can control who can edit, publish, or delete articles.

**Acceptance Criteria:**

**Given** I am an organization owner
**When** I view article settings
**Then** I can see:
  - Article owner (who created the article)
  - Current permissions (who can edit, publish, delete)
  - Permission inheritance (from project or organization settings)
**And** I can modify permissions if needed

**Given** I want to change article ownership
**When** I view article settings
**Then** I can:
  - Transfer ownership to another team member
  - See ownership history (if tracked)
  - Set ownership transfer reason (optional)
**And** ownership change is saved
**And** new owner receives notification
**And** previous owner is notified (optional)

**Given** I want to set article permissions
**When** I configure article permissions
**Then** I can set:
  - **Edit Permission:** Who can edit this article
    - Owner only
    - Assigned team member
    - All team members
    - Specific team members
  - **Publish Permission:** Who can publish this article
    - Owner only
    - Organization owner only
    - All team members (with approval if required)
  - **Delete Permission:** Who can delete this article
    - Owner only
    - Organization owner only
    - All team members
**And** permissions are saved
**And** permissions are enforced when users try to perform actions

**Given** permissions are set
**When** a team member tries to edit an article
**Then** if they have edit permission:
  - Editing is allowed
  - Article editor opens
**And** if they don't have edit permission:
  - Editing is blocked
  - Message: "You don't have permission to edit this article"
  - Article is read-only for them

**Given** permissions are set
**When** a team member tries to publish an article
**Then** if they have publish permission:
  - Publishing proceeds (subject to approval workflow if enabled)
**And** if they don't have publish permission:
  - Publishing is blocked
  - Message: "You don't have permission to publish this article"
  - Option to request publish permission

**Given** permissions are set
**When** a team member tries to delete an article
**Then** if they have delete permission:
  - Deletion is allowed (with confirmation)
**And** if they don't have delete permission:
  - Deletion is blocked
  - Message: "You don't have permission to delete this article"
  - Only organization owner can delete

**Given** I want to set default permissions
**When** I configure organization or project settings
**Then** I can set default permissions for new articles:
  - Default ownership (creator or assigned team member)
  - Default edit permission
  - Default publish permission
  - Default delete permission
**And** defaults are applied to new articles
**And** defaults can be overridden per article

**Technical Notes:**
- Article ownership: `articles.owner_id` foreign key to users table
- Permissions: Stored in `article_permissions` table or `articles.permissions` JSONB column
- Permission enforcement: API-level permission checks before allowing actions
- Default permissions: Organization/project-level defaults applied to new articles
- Permission inheritance: Permissions can inherit from project or organization settings

---

### Story 9.5: Article Status Tracking and Workflow States

**Priority:** P1 (Post-MVP - Collaboration, not required for MVP)

As a user,
I want to track article status through workflow states,
So that I can see where each article is in the content creation and publishing process.

**Acceptance Criteria:**

**Given** I have articles in various states
**When** I view the article list
**Then** I can see article status badges:
  - **Draft** (gray) - Article being created/edited
  - **In Review** (yellow) - Submitted for approval
  - **Approved** (green) - Approved, ready to publish
  - **Rejected** (red) - Rejected, needs changes
  - **Scheduled** (blue) - Scheduled for future publishing
  - **Published** (green) - Published and live
  - **Archived** (gray) - Archived, no longer active
**And** status is clearly visible
**And** I can filter articles by status

**Given** I view an article
**When** I see article details
**Then** I can see:
  - Current status
  - Status history (when status changed, who changed it)
  - Status change reasons (if provided)
  - Next actions available (based on current status)
**And** status information is displayed prominently

**Given** I want to change article status
**When** I perform actions on an article
**Then** status changes automatically:
  - Create article → "Draft"
  - Submit for approval → "In Review"
  - Approve → "Approved"
  - Reject → "Rejected"
  - Schedule publish → "Scheduled"
  - Publish → "Published"
  - Archive → "Archived"
**And** status changes are logged
**And** relevant users receive notifications

**Given** I want to see status workflow
**When** I view article status
**Then** I can see:
  - Status workflow diagram (visual representation)
  - Current position in workflow
  - Available transitions (what statuses can be reached from current status)
  - Required actions to move to next status
**And** workflow is clear and intuitive

**Given** I want to track status history
**When** I view article details
**Then** I can see status history:
  - Timeline of status changes
  - Who changed the status
  - When status changed
  - Reason for change (if provided)
**And** history is complete and auditable
**And** I can see status trends over time

**Given** I want to filter by status
**When** I view article list
**Then** I can filter by:
  - Single status (e.g., "Show only Draft articles")
  - Multiple statuses (e.g., "Show Draft and In Review")
  - Status groups (e.g., "Active", "Completed", "Archived")
**And** filters are saved (if configured)
**And** I can see count of articles per status

**Given** I want to see status statistics
**When** I view dashboard or analytics
**Then** I can see:
  - Articles by status (count and percentage)
  - Status distribution chart
  - Average time in each status
  - Status transition rates
**And** statistics help identify bottlenecks
**And** I can optimize workflow based on data

**Technical Notes:**
- Article status: Enum field in `articles` table (draft, in-review, approved, rejected, scheduled, published, archived)
- Status history: `article_status_history` table tracks all status changes
- Status transitions: Valid transitions defined in application logic
- Status badges: Visual indicators with colors for quick recognition
- Status filtering: Client-side and server-side filtering support

---

### Story 9.6: Article Status Change Notifications

**Priority:** P1 (Post-MVP - Collaboration, not required for MVP)

As a user,
I want to receive notifications when article status changes,
So that I can stay informed about content progress and take action when needed.

**Acceptance Criteria:**

**Given** an article status changes
**When** status is updated
**Then** relevant users receive notifications:
  - Article owner (always notified)
  - Assigned team member (if different from owner)
  - Organization owner (if approval-related status change)
  - Commenters (if they commented on the article)
**And** notifications are sent immediately (or batched if configured)

**Given** I receive a status change notification
**When** notification is delivered
**Then** I see:
  - **In-App Notification:**
    - Notification bell shows new notification
    - Notification includes: Article title, status change, who changed it, timestamp
    - Click to view article
  - **Email Notification (if configured):**
    - Email subject: "Article '[Title]' status changed to [Status]"
    - Email body includes article details and link
    - Email is branded (organization branding if white-label)
**And** notification is clear and actionable

**Given** article status changes to "In Review"
**When** article is submitted for approval
**Then** organization owner receives notification:
  - "Article '[Title]' submitted for approval by [Author]"
  - Notification includes article link
  - Notification includes time in draft
**And** owner can click to review article
**And** notification appears in "Pending Approval" queue

**Given** article status changes to "Approved"
**When** article is approved
**Then** article author receives notification:
  - "Article '[Title]' has been approved"
  - Notification includes approval comments (if any)
  - Notification includes next steps (can now publish)
**And** author can click to view article or publish

**Given** article status changes to "Rejected"
**When** article is rejected
**Then** article author receives notification:
  - "Article '[Title]' has been rejected"
  - Notification includes rejection feedback
  - Notification includes suggestions for improvement
**And** author can click to view article and make changes
**And** author can resubmit after making changes

**Given** article status changes to "Published"
**When** article is published
**Then** relevant users receive notification:
  - Article author: "Article '[Title]' has been published"
  - Organization owner: "Article '[Title]' published by [Author]"
  - Assigned team member: "Assigned article '[Title]' has been published"
**And** notifications include published URL
**And** users can click to view published article

**Given** I want to configure notification preferences
**When** I view notification settings
**Then** I can configure:
  - Which status changes trigger notifications
  - Notification channels (in-app, email, both)
  - Notification frequency (immediate, daily digest, weekly digest)
  - Quiet hours (don't send notifications during these hours)
**And** preferences are saved
**And** notifications respect preferences

**Given** I want to manage notifications
**When** I view notifications
**Then** I can:
  - Mark notifications as read
  - Mark all as read
  - Delete notifications
  - Filter notifications (by type, by article, by date)
**And** notification history is preserved (if configured)
**And** I can see unread notification count

**Technical Notes:**
- Status change notifications: Triggered on article status update
- Notification delivery: In-app (websocket) and email (async via Inngest)
- Notification storage: `notifications` table with user_id, article_id, type, status
- Notification preferences: User-configurable notification settings
- Notification batching: Optional daily/weekly digest for non-urgent notifications

---

### Epic 10: Billing & Usage Management
**User Outcome:** Users can manage subscriptions, track usage, view billing history, handle overages, and upgrade/downgrade plans.

**FRs covered:** FR6, FR87-FR99

**Key Capabilities:**
- Manage billing and subscription (upgrade, downgrade, cancel)
- Track usage credits per organization (articles, keyword researches, API calls)
- View real-time usage dashboard (credits used vs. plan limits)
- Alert users when approaching usage limits (90% threshold)
- Calculate and charge overage fees
- Manage subscription billing (Stripe integration, invoices, payment processing)
- Upgrade/downgrade plans with prorated billing
- Track API costs per organization
- View billing history and download invoices
- Enforce usage limits per plan tier
- Alert when approaching cost thresholds
- Identify users approaching plan limits
- Suggest upgrades based on usage patterns
- Show value of upgrading (feature comparison)

**Dependencies:** Epic 1 (requires payment foundation), Epic 9 (requires usage tracking)

**Success Metrics:**
- 30%+ of customers upgrade within 6 months
- < 5% payment failure rate
- Real-time usage tracking accuracy (100%)

### Story 10.1: Usage Credit Tracking Per Organization

**Priority:** P1 (Post-MVP - Usage tracking can be basic, billing already in 1-7)

As the system,
I want to track usage credits per organization,
So that I can monitor usage against plan limits and calculate overages.

**Acceptance Criteria:**

**Given** an organization performs operations
**When** operations are completed
**Then** the system tracks usage for:
  - **Articles:** Count of articles generated (incremented on generation)
  - **Keyword Research:** Count of keyword research operations (incremented on research)
  - **API Calls:** Count of API calls made (Tavily, DataForSEO, OpenRouter)
  - **CMS Connections:** Count of connected CMS platforms
  - **E-Commerce Stores:** Count of connected stores
  - **Projects:** Count of projects created
  - **Team Members:** Count of team members
  - **Image Storage:** Storage used in GB (tracked continuously)
**And** usage is tracked in real-time
**And** usage is stored in `usage_tracking` table with:
  - organization_id
  - metric_type (articles, keyword_research, api_calls, etc.)
  - usage_count (or usage_amount for storage)
  - billing_period (month/year)
  - last_updated timestamp

**Given** usage is tracked
**When** I view usage data
**Then** I can see:
  - Current usage for each metric
  - Usage period (current month)
  - Usage history (previous months)
  - Usage trends (increasing, decreasing, stable)
**And** usage data is accurate and up-to-date
**And** usage updates in real-time (via websockets)

**Given** usage tracking occurs
**When** operations are performed
**Then** usage is incremented immediately:
  - Article generated → articles count +1
  - Keyword research completed → keyword_research count +1
  - API call made → api_calls count +1
  - Storage used → storage_gb updated
**And** usage is atomic (no double-counting)
**And** usage is persisted to database

**Given** billing period resets
**When** new billing period starts (monthly)
**Then** usage counters reset to 0
**And** previous period's usage is archived
**And** new period tracking begins
**And** users see fresh usage counters

**Given** I want to see usage breakdown
**When** I view usage details
**Then** I can see:
  - Usage by metric type
  - Usage by date (daily breakdown)
  - Usage by project (if applicable)
  - Usage by team member (if applicable)
**And** breakdown helps identify usage patterns

**Technical Notes:**
- Usage tracking: Real-time tracking in `usage_tracking` table
- Atomic operations: Database transactions ensure accurate counting
- Billing period: Monthly reset (aligned with subscription billing cycle)
- Real-time updates: Via websockets for immediate visibility
- Usage storage: Per organization, per metric type, per billing period

---

### Story 10.2: Real-Time Usage Dashboard

**Priority:** P1 (Post-MVP - Usage tracking can be basic, billing already in 1-7)

As a user,
I want to view a real-time usage dashboard showing credits used vs. plan limits,
So that I can monitor my usage and avoid unexpected overages.

**Acceptance Criteria:**

**Given** I am logged in
**When** I navigate to Settings > Usage or view the usage widget (Epic 2.3)
**Then** I see a usage dashboard with:
  - **Current Plan:** Plan name (Starter, Pro, Agency)
  - **Billing Period:** Current month (e.g., "December 2024")
  - **Usage Metrics:**
    - Articles: "8 of 10 articles used" (with progress bar)
    - Keyword Research: "45 of 50 keyword researches used"
    - API Calls: "850 of 1,000 API calls used"
    - CMS Connections: "1 of 1 CMS connections used"
    - E-Commerce Stores: "1 of 1 stores used"
    - Projects: "1 of 1 projects used"
    - Team Members: "1 of 1 team members used"
    - Image Storage: "2.5 of 5 GB used"
  - **Progress Indicators:**
    - Visual progress bars (color-coded: green 0-75%, yellow 76-90%, red 91-100%)
    - Percentage used
    - Remaining credits
    - Days remaining in billing cycle
**And** metrics update in real-time (via websockets)

**Given** I view usage metrics
**When** I see usage data
**Then** each metric shows:
  - Current usage / Plan limit
  - Visual progress bar
  - Percentage used
  - Remaining credits
  - Days remaining in billing cycle
  - Trend indicator (if available: ↑, ↓, →)
**And** metrics are clearly labeled
**And** I can click metrics to see detailed breakdown

**Given** I want to see usage trends
**When** I view usage dashboard
**Then** I can see:
  - Usage over time (daily, weekly trends)
  - Projected usage (based on current rate)
  - Comparison to previous period
  - Usage velocity (how fast I'm using credits)
**And** trends help predict if I'll exceed limits

**Given** I am approaching a limit (90% threshold)
**When** I view usage dashboard
**Then** I see warning indicators:
  - Yellow progress bar (76-90% usage)
  - Warning message: "You're approaching your [metric] limit"
  - Days remaining estimate
  - "Upgrade Plan" button or link
**And** I receive email notification (Story 10.3)

**Given** I have exceeded a limit
**When** I view usage dashboard
**Then** I see overage indicators:
  - Red progress bar (100%+ usage)
  - Overage amount displayed
  - Overage cost displayed
  - Message: "You've exceeded your [metric] limit. Overage charges apply."
  - "Upgrade Plan" button prominently displayed
**And** overage is tracked for billing (Story 10.4)

**Given** I want to see detailed usage
**When** I click on a usage metric
**Then** I see detailed breakdown:
  - Usage by date (daily breakdown)
  - Usage by project (if applicable)
  - Usage by operation type (if applicable)
  - Usage history (previous periods)
**And** I can export usage data (CSV, PDF)

**Technical Notes:**
- Usage dashboard: Real-time data from `usage_tracking` table
- Progress indicators: Color-coded based on usage percentage
- Real-time updates: Via websockets (NFR-P3: < 1 second latency)
- Usage calculations: Current usage vs. plan limits
- Overage tracking: Displayed when usage exceeds limits

---

### Story 10.3: Usage Limit Alerts and Notifications

**Priority:** P1 (Post-MVP - Usage tracking can be basic, billing already in 1-7)

As the system,
I want to alert users when they approach usage limits,
So that users can upgrade plans or adjust usage before hitting limits.

**Acceptance Criteria:**

**Given** usage tracking is active
**When** usage reaches 90% of any limit
**Then** the system:
  - Detects threshold crossing (90% of plan limit)
  - Triggers alert notification
  - Sends in-app notification
  - Sends email notification (if not already sent this period)
  - Displays warning in usage dashboard
**And** alert is sent once per billing period (per metric)
**And** alert includes actionable information

**Given** I receive a usage limit alert
**When** alert is delivered
**Then** I see:
  - **In-App Notification:**
    - Notification: "You're approaching your [metric] limit (90% used)"
    - Current usage: "9 of 10 articles used"
    - Days remaining: "12 days left in billing cycle"
    - Projected usage: "You're on track to exceed your limit"
    - "View Usage" and "Upgrade Plan" buttons
  - **Email Notification:**
    - Subject: "You're approaching your [metric] limit"
    - Body includes usage details and upgrade options
    - Email is branded (organization branding if white-label)
**And** notification is clear and actionable

**Given** usage continues to increase
**When** usage reaches 95% of limit
**Then** I receive a second alert:
  - "You're at 95% of your [metric] limit"
  - More urgent tone
  - Stronger upgrade prompt
**And** alert emphasizes urgency

**Given** usage exceeds limit
**When** usage goes over 100%
**Then** I receive overage alert:
  - "You've exceeded your [metric] limit"
  - Overage amount: "2 articles over limit"
  - Overage cost: "$6.00 in overage charges"
  - "Upgrade Plan" button prominently displayed
**And** alert explains overage billing

**Given** I want to configure alert preferences
**When** I view notification settings
**Then** I can configure:
  - Alert thresholds (90%, 95%, 100%)
  - Alert channels (in-app, email, both)
  - Alert frequency (once per period, every threshold)
  - Quiet hours (don't send alerts during these hours)
**And** preferences are saved
**And** alerts respect preferences

**Given** I want to see alert history
**When** I view usage alerts
**Then** I can see:
  - History of alerts sent
  - Alert dates and times
  - Metrics that triggered alerts
  - Actions taken (if any)
**And** history helps track usage patterns

**Technical Notes:**
- Alert thresholds: 90%, 95%, 100% of plan limits
- Alert delivery: In-app (websocket) and email (async via Inngest)
- Alert frequency: Once per billing period per metric (unless configured otherwise)
- Alert storage: `usage_alerts` table tracks sent alerts
- Alert preferences: User-configurable notification settings

---

### Story 10.4: Overage Fee Calculation and Billing

**Priority:** P1 (Post-MVP - Usage tracking can be basic, billing already in 1-7)

As the system,
I want to calculate and charge overage fees for usage beyond plan limits,
So that organizations pay for additional usage while maintaining predictable base pricing.

**Acceptance Criteria:**

**Given** usage exceeds plan limits
**When** billing period ends
**Then** the system calculates overages:
  - **Articles:** (Usage - Plan Limit) × Overage Rate
    - Starter: $3.00 per article over limit
    - Pro: $1.50 per article over limit
    - Agency: $1.00 per article over limit
  - **Keyword Research:** (Usage - Plan Limit) × $0.10 per research
  - **Additional CMS:** (Usage - Plan Limit) × $10/month per CMS
  - **Additional Store:** (Usage - Plan Limit) × $20/month per store
  - **Additional Project:** (Usage - Plan Limit) × $15/month per project
  - **Additional Team Member:** (Usage - Plan Limit) × $15/month per member
  - **Image Storage:** (Usage - Plan Limit in GB) × $0.10/GB/month
**And** overages are calculated accurately
**And** overages are stored in `usage_overages` table

**Given** overages are calculated
**When** monthly billing occurs
**Then** overage charges are:
  - Added to monthly invoice
  - Itemized separately on invoice
  - Charged via Stripe (metered billing or invoice line items)
  - Included in total amount due
**And** invoice shows:
  - Base subscription fee
  - Overage charges (itemized by type)
  - Total amount
**And** billing is transparent

**Given** I want to see overage charges
**When** I view billing or usage
**Then** I can see:
  - Current period overages (if any)
  - Overage breakdown by metric type
  - Overage cost per metric
  - Total overage cost
  - Projected overages (if current usage continues)
**And** overages are clearly displayed
**And** I can see overage history

**Given** I want to avoid overages
**When** I see overage charges
**Then** I can:
  - Upgrade plan to increase limits
  - Adjust usage to stay within limits
  - See cost comparison (overage cost vs. upgrade cost)
**And** system suggests upgrade if overage cost exceeds upgrade cost

**Given** overage billing occurs
**When** invoice is generated
**Then** invoice includes:
  - Base subscription: "$89.00"
  - Overage charges:
    - "2 articles over limit: $6.00"
    - "5 keyword researches over limit: $0.50"
  - Total: "$95.50"
**And** invoice is clear and itemized
**And** invoice is downloadable (PDF)

**Technical Notes:**
- Overage calculation: (Usage - Plan Limit) × Overage Rate
- Overage rates: Plan-specific rates stored in plan configuration
- Overage storage: `usage_overages` table tracks overages per billing period
- Stripe integration: Metered billing or invoice line items for overages
- Invoice generation: Stripe generates invoices with overage line items

---

### Story 10.5: Stripe Subscription Management

**Priority:** P1 (Post-MVP - Usage tracking can be basic, billing already in 1-7)

As the system,
I want to manage subscriptions via Stripe,
So that users can subscribe, update, and cancel plans with proper billing.

**Acceptance Criteria:**

**Given** a user selects a subscription plan
**When** user completes payment
**Then** the system:
  - Creates Stripe subscription via Stripe API
  - Links subscription to organization
  - Stores subscription ID in `organizations.stripe_subscription_id`
  - Activates account (Epic 1)
  - Sets billing period start/end dates
  - Enables plan features
**And** subscription is active
**And** user gains dashboard access

**Given** I want to upgrade my subscription
**When** I click "Upgrade Plan"
**Then** I can:
  - View available plans (Pro, Agency)
  - See plan comparison (features, limits, pricing)
  - Select new plan
  - See prorated billing calculation:
    - Remaining days in current period
    - Prorated credit for current plan
    - Prorated charge for new plan
    - Net amount due
  - Confirm upgrade
**And** upgrade is processed via Stripe
**And** plan features are updated immediately
**And** prorated billing is applied

**Given** I want to downgrade my subscription
**When** I click "Downgrade Plan"
**Then** I can:
  - View lower plans (Starter, Pro)
  - See plan comparison
  - Select new plan
  - See downgrade effective date (end of current billing period)
  - Confirm downgrade
**And** downgrade is scheduled for end of billing period
**And** plan features remain active until downgrade takes effect
**And** I receive confirmation

**Given** I want to cancel my subscription
**When** I click "Cancel Subscription"
**Then** I see:
  - Cancellation confirmation dialog
  - Effective date (end of current billing period)
  - Access continuation (access until end of period)
  - Cancellation reason (optional survey)
**And** if I confirm:
  - Subscription is cancelled in Stripe
  - Cancellation is scheduled for end of billing period
  - Account remains active until cancellation date
  - I receive cancellation confirmation
**And** I can reactivate before cancellation date

**Given** I want to change billing frequency
**When** I view subscription settings
**Then** I can:
  - Switch from monthly to annual billing
  - Switch from annual to monthly billing
  - See prorated billing calculation
  - Confirm change
**And** billing frequency is updated in Stripe
**And** next invoice reflects new billing frequency

**Given** payment fails
**When** Stripe payment fails
**Then** the system:
  - Receives Stripe webhook (payment_failed)
  - Logs payment failure
  - Sends notification to user
  - Starts 7-day grace period
  - Attempts automatic retry (Stripe retry logic)
**And** if retry succeeds:
  - Payment is processed
  - Account remains active
  - User receives success notification
**And** if retry fails after grace period:
  - Account is suspended (Epic 1)
  - User cannot access dashboard
  - User receives suspension notification

**Given** I want to update payment method
**When** I view billing settings
**Then** I can:
  - View current payment method
  - Update payment method (via Stripe customer portal)
  - Add new payment method
  - Set default payment method
**And** payment method updates are synced with Stripe
**And** future charges use updated payment method

**Technical Notes:**
- Stripe integration: Stripe API for subscription management
- Subscription storage: `organizations.stripe_subscription_id` links to Stripe
- Prorated billing: Calculated based on remaining days in billing period
- Webhook handling: Stripe webhooks for payment events (payment_succeeded, payment_failed, etc.)
- Grace period: 7-day grace period for failed payments before suspension

---

### Story 10.6: Plan Upgrade and Downgrade with Prorated Billing

**Priority:** P1 (Post-MVP - Usage tracking can be basic, billing already in 1-7)

As a user,
I want to upgrade or downgrade my subscription plan with prorated billing,
So that I pay or receive credit for the unused portion of my current plan.

**Acceptance Criteria:**

**Given** I want to upgrade my plan
**When** I click "Upgrade Plan"
**Then** I see upgrade options:
  - Available plans (Pro, Agency)
  - Plan comparison (features, limits, pricing)
  - Current plan highlighted
  - Upgrade benefits clearly shown
**And** I can select a plan to upgrade to

**Given** I select a plan to upgrade to
**When** I proceed with upgrade
**Then** the system calculates prorated billing:
  - **Remaining Days:** Days left in current billing period
  - **Current Plan Credit:** (Remaining Days / Total Days) × Current Plan Price
  - **New Plan Charge:** (Remaining Days / Total Days) × New Plan Price
  - **Net Amount:** New Plan Charge - Current Plan Credit
**And** I see prorated billing breakdown:
  - "Current plan credit: $45.00 (15 days remaining)"
  - "New plan charge: $110.00 (15 days remaining)"
  - "Amount due today: $65.00"
**And** I can confirm upgrade

**Given** I confirm upgrade
**When** upgrade is processed
**Then** the system:
  - Charges prorated amount via Stripe
  - Updates subscription in Stripe
  - Updates plan in database
  - Enables new plan features immediately
  - Updates usage limits immediately
  - Sends confirmation email
**And** upgrade takes effect immediately
**And** I can use new plan features right away

**Given** I want to downgrade my plan
**When** I click "Downgrade Plan"
**Then** I see downgrade options:
  - Available lower plans (Starter, Pro)
  - Plan comparison
  - Feature loss warnings (what I'll lose)
  - Downgrade effective date (end of current billing period)
**And** I can select a plan to downgrade to

**Given** I select a plan to downgrade to
**When** I confirm downgrade
**Then** the system:
  - Schedules downgrade for end of billing period
  - No immediate charge (downgrade takes effect at period end)
  - Plan features remain active until downgrade date
  - I receive confirmation: "Downgrade scheduled for [date]"
**And** I can cancel downgrade before effective date
**And** downgrade takes effect automatically at period end

**Given** downgrade takes effect
**When** billing period ends
**Then** the system:
  - Updates subscription in Stripe
  - Updates plan in database
  - Disables features not in new plan
  - Updates usage limits
  - Sends confirmation email
**And** downgrade is complete
**And** I see new plan features and limits

**Given** I want to see upgrade/downgrade history
**When** I view billing history
**Then** I can see:
  - Past plan changes
  - Change dates
  - Prorated amounts (if upgrades)
  - Effective dates
**And** history is complete and auditable

**Technical Notes:**
- Prorated billing: Calculated based on remaining days in billing period
- Upgrade: Immediate effect, prorated charge
- Downgrade: Scheduled for period end, no immediate charge
- Stripe integration: Subscription updates via Stripe API
- Plan changes: Logged in `plan_changes` table for audit trail

---

### Story 10.7: API Cost Tracking and Monitoring

**Priority:** P1 (Post-MVP - Usage tracking can be basic, billing already in 1-7)

As the system,
I want to track API costs per organization,
So that I can monitor costs and ensure cost efficiency targets are met.

**Acceptance Criteria:**

**Given** API calls are made (Tavily, DataForSEO, OpenRouter)
**When** API calls complete
**Then** the system tracks:
  - **API Service:** Which service (Tavily, DataForSEO, OpenRouter)
  - **Cost per Call:** Cost of the API call
  - **Organization:** Which organization made the call
  - **Operation Type:** What operation (article generation, keyword research, etc.)
  - **Timestamp:** When the call was made
**And** costs are stored in `api_costs` table
**And** costs are tracked in real-time

**Given** API costs are tracked
**When** I view API cost dashboard
**Then** I can see:
  - **Total API Costs This Month:** "$45.20"
  - **Cost Breakdown by Service:**
    - Tavily: "$12.50 (28 queries × $0.08)"
    - DataForSEO: "$8.70 (SERP analysis, keyword research)"
    - OpenRouter: "$24.00 (12 articles × $2.00)"
  - **Cost per Operation:**
    - Average cost per article: "$2.00"
    - Average cost per keyword research: "$0.10"
  - **Cost Trends:** Chart showing costs over time
**And** costs are displayed clearly
**And** I can filter by date range, service, operation type

**Given** API costs exceed threshold
**When** API costs exceed 20% of subscription revenue
**Then** the system:
  - Detects cost threshold crossing
  - Alerts organization owner: "API costs are 25% of your subscription revenue"
  - Suggests cost optimization strategies
  - Flags for review (internal monitoring)
**And** alert helps identify cost inefficiencies
**And** cost efficiency target: < $0.80/article API costs

**Given** I want to see cost efficiency
**When** I view API costs
**Then** I can see:
  - Cost per article (target: < $0.80)
  - Cost per keyword research
  - Cost efficiency trends (improving, declining)
  - Comparison to targets
**And** I can identify cost optimization opportunities

**Given** I want to see cost by project or operation
**When** I view API cost breakdown
**Then** I can see:
  - Costs by project (if applicable)
  - Costs by operation type (article generation, keyword research, etc.)
  - Costs by team member (if applicable)
  - Top cost drivers
**And** breakdown helps identify where costs are highest

**Given** API cost tracking
**When** costs are calculated
**Then** the system:
  - Tracks costs accurately (from API provider responses)
  - Aggregates costs per organization
  - Calculates cost efficiency metrics
  - Stores historical cost data
**And** costs are used for:
  - Cost monitoring and alerts
  - Cost efficiency reporting
  - Internal cost analysis
  - Customer cost transparency (optional)

**Technical Notes:**
- API cost tracking: Real-time tracking in `api_costs` table
- Cost sources: API provider responses (Tavily, DataForSEO, OpenRouter)
- Cost aggregation: Per organization, per billing period
- Cost efficiency: Calculated as cost per article, cost per operation
- Cost alerts: Triggered when costs exceed 20% of subscription revenue

---

### Story 10.8: Billing History and Invoice Management

**Priority:** P1 (Post-MVP - Usage tracking can be basic, billing already in 1-7)

As a user,
I want to view my billing history and download invoices,
So that I can track payments and maintain financial records.

**Acceptance Criteria:**

**Given** I have subscription and billing activity
**When** I navigate to Settings > Billing > History
**Then** I see billing history with:
  - List of all invoices and charges
  - Invoice date
  - Amount charged
  - Payment status (Paid, Pending, Failed)
  - Invoice number
  - Plan at time of invoice
  - Quick actions: "View Invoice", "Download PDF"
**And** invoices are sorted by most recent first
**And** I can filter by date range, status, amount

**Given** I want to view an invoice
**When** I click "View Invoice"
**Then** I see invoice details:
  - **Invoice Header:**
    - Invoice number
    - Invoice date
    - Due date
    - Payment status
  - **Billing Information:**
    - Organization name and address
    - Billing contact information
  - **Invoice Items:**
    - Base subscription: "$89.00"
    - Overage charges (if any):
      - "2 articles over limit: $6.00"
      - "5 keyword researches over limit: $0.50"
    - Subtotal
    - Tax (if applicable)
    - Total
  - **Payment Information:**
    - Payment method
    - Transaction ID
    - Payment date
**And** invoice is professionally formatted
**And** invoice is branded (organization branding if white-label)

**Given** I want to download an invoice
**When** I click "Download PDF"
**Then** I receive a PDF invoice with:
  - All invoice details
  - Professional formatting
  - Branded design (organization branding if white-label)
  - Suitable for accounting/tax purposes
**And** PDF is downloadable
**And** PDF can be saved or printed

**Given** I want to see payment history
**When** I view billing history
**Then** I can see:
  - All payments made
  - Payment dates
  - Payment amounts
  - Payment methods
  - Transaction IDs
  - Payment status (Success, Failed, Refunded)
**And** I can filter by payment status
**And** I can see failed payment attempts

**Given** I want to see upcoming charges
**When** I view billing
**Then** I can see:
  - Next billing date
  - Expected charge amount
  - Current usage (to estimate overages)
  - Projected total (base + estimated overages)
**And** I can prepare for upcoming charges
**And** I can upgrade plan if needed

**Given** I want to export billing data
**When** I view billing history
**Then** I can:
  - Export billing history as CSV
  - Export invoices as PDF (bulk download)
  - Export for accounting software (if supported)
**And** exports are formatted for financial records
**And** exports include all relevant data

**Technical Notes:**
- Billing history: Retrieved from Stripe API or stored in `invoices` table
- Invoice generation: Stripe generates invoices, stored and accessible via API
- Invoice storage: PDFs stored in Cloudflare R2 or Supabase Storage
- Invoice branding: White-label branding applied to invoices (if configured)
- Payment history: Synced from Stripe payment events

---

### Story 10.9: Usage Limit Enforcement Per Plan Tier

**Priority:** P1 (Post-MVP - Usage tracking can be basic, billing already in 1-7)

As the system,
I want to enforce usage limits per plan tier,
So that users cannot exceed their plan limits without upgrading or paying overages.

**Acceptance Criteria:**

**Given** a user attempts to perform an operation
**When** operation would exceed plan limit
**Then** the system checks:
  - Current usage for that metric
  - Plan limit for that metric
  - Whether operation would exceed limit
**And** if limit would be exceeded:
  - Operation is blocked (for hard limits)
  - Or operation proceeds with overage warning (for soft limits)
**And** user sees appropriate message

**Given** I try to generate an article
**When** I have reached my article limit (10/10 articles)
**Then** I see:
  - Message: "You've reached your article limit for this month (10 articles)"
  - Current usage: "10 of 10 articles used"
  - Options:
    - "Upgrade Plan" (to get more articles)
    - "Wait for next billing period" (reset in X days)
    - "Purchase Overage" (if overage allowed)
  - Article generation is blocked
**And** I cannot generate articles until limit resets or I upgrade

**Given** I try to perform keyword research
**When** I have reached my keyword research limit (50/50)
**Then** I see:
  - Message: "You've reached your keyword research limit (50 researches)"
  - Options: "Upgrade Plan" or "Wait for reset"
  - Keyword research is blocked
**And** I cannot perform research until limit resets or I upgrade

**Given** I try to connect additional CMS
**When** I have reached my CMS connection limit (1/1 for Starter)
**Then** I see:
  - Message: "You've reached your CMS connection limit (1 connection)"
  - Options: "Upgrade Plan" or "Remove existing connection"
  - Connection is blocked
**And** I cannot add more connections until I upgrade

**Given** I try to create additional projects
**When** I have reached my project limit (1/1 for Starter)
**Then** I see:
  - Message: "You've reached your project limit (1 project)"
  - Options: "Upgrade Plan" or "Delete existing project"
  - Project creation is blocked
**And** I cannot create more projects until I upgrade

**Given** I try to add team members
**When** I have reached my team member limit (1/1 for Starter)
**Then** I see:
  - Message: "You've reached your team member limit (1 member)"
  - Options: "Upgrade Plan" or "Remove existing member"
  - Team member addition is blocked
**And** I cannot add more members until I upgrade

**Given** limits are enforced
**When** operations are attempted
**Then** enforcement is:
  - **Hard Limits:** Blocked (articles, keyword research, API calls)
  - **Soft Limits:** Allowed with overage (if overage enabled)
  - **Feature Limits:** Blocked (CMS connections, projects, team members)
**And** enforcement is consistent
**And** error messages are clear and actionable

**Technical Notes:**
- Limit enforcement: Checked before allowing operations
- Hard limits: Block operations (articles, keyword research)
- Soft limits: Allow with overage (if configured)
- Feature limits: Block feature access (CMS, projects, team members)
- Limit checks: Performed at API level, not just UI level

---

### Story 10.10: Cost Threshold Alerts

**Priority:** P1 (Post-MVP - Usage tracking can be basic, billing already in 1-7)

As the system,
I want to alert users when approaching cost thresholds,
So that users can monitor costs and optimize usage.

**Acceptance Criteria:**

**Given** API costs are tracked (Story 10.7)
**When** API costs approach thresholds
**Then** the system monitors:
  - API costs as % of subscription revenue (target: < 20%)
  - Total costs (API + infrastructure) as % of revenue
  - Cost per article (target: < $0.80)
  - Cost efficiency trends
**And** alerts are triggered when thresholds are crossed

**Given** API costs exceed 20% of subscription revenue
**When** cost threshold is crossed
**Then** organization owner receives alert:
  - "API costs are 25% of your subscription revenue"
  - Current costs: "$45.20 this month"
  - Subscription revenue: "$89.00/month"
  - Cost percentage: "25%"
  - Recommendations: "Consider optimizing article generation or upgrading plan"
**And** alert helps identify cost inefficiencies
**And** alert includes actionable recommendations

**Given** cost per article exceeds target
**When** cost per article > $0.80
**Then** I receive alert:
  - "Cost per article is $1.20 (target: < $0.80)"
  - Breakdown: "Tavily: $0.40, DataForSEO: $0.05, OpenRouter: $0.75"
  - Recommendations: "Consider using cached research or optimizing prompts"
**And** alert helps optimize costs

**Given** I want to configure cost alerts
**When** I view cost alert settings
**Then** I can configure:
  - Cost threshold percentage (default: 20% of revenue)
  - Cost per article threshold (default: $0.80)
  - Alert channels (in-app, email, both)
  - Alert frequency
**And** preferences are saved
**And** alerts respect preferences

**Given** cost alerts are sent
**When** I view cost dashboard
**Then** I can see:
  - Current costs vs. thresholds
  - Alert status (if alerts were sent)
  - Cost trends (improving, declining)
  - Recommendations for cost optimization
**And** dashboard helps monitor and optimize costs

**Technical Notes:**
- Cost threshold monitoring: Tracks API costs vs. subscription revenue
- Alert thresholds: 20% of revenue (default), $0.80 per article (default)
- Alert delivery: In-app and email notifications
- Cost optimization: Recommendations based on cost analysis
- Alert preferences: User-configurable thresholds and channels

---

### Story 10.11: Upgrade Suggestions Based on Usage Patterns

**Priority:** P1 (Post-MVP - Usage tracking can be basic, billing already in 1-7)

As the system,
I want to identify users approaching plan limits and suggest upgrades,
So that users can upgrade proactively and avoid hitting limits.

**Acceptance Criteria:**

**Given** usage is tracked
**When** usage patterns indicate upgrade need
**Then** the system identifies:
  - Users consistently at 80%+ of limits
  - Users frequently hitting limits
  - Users with high overage costs
  - Users who would benefit from higher plan features
**And** upgrade suggestions are generated

**Given** I am consistently at 80%+ of my limits
**When** I view dashboard or usage
**Then** I see upgrade suggestion:
  - "You're consistently using 85% of your limits. Upgrade to Pro for 5× more articles."
  - Current plan: "Starter (10 articles/month)"
  - Suggested plan: "Pro (50 articles/month)"
  - Upgrade benefit: "5× more articles, revenue attribution, multi-store"
  - "Upgrade Now" button
**And** suggestion is prominent but not intrusive

**Given** I have high overage costs
**When** overage costs exceed upgrade cost
**Then** I see upgrade suggestion:
  - "You're paying $45/month in overages. Upgrade to Pro for $220/month and save $25/month."
  - Overage cost: "$45/month"
  - Upgrade cost: "$220/month (vs. $89 + $45 = $134/month effective)"
  - Savings: "$25/month savings + more features"
  - "Upgrade Now" button
**And** suggestion shows clear value proposition

**Given** I would benefit from plan features
**When** usage patterns indicate feature need
**Then** I see feature-based upgrade suggestion:
  - "You're managing multiple stores. Upgrade to Pro for multi-store management."
  - Current limitation: "Starter plan: 1 store limit"
  - Upgrade benefit: "Pro plan: 3 stores, revenue attribution, more features"
  - "Upgrade Now" button
**And** suggestion is contextual to my usage

**Given** I want to see upgrade comparison
**When** I click "View Upgrade Options"
**Then** I see:
  - Plan comparison table (current vs. suggested plan)
  - Feature differences highlighted
  - Limit increases shown
  - Pricing comparison
  - Value proposition
**And** comparison helps me make informed decision

**Given** upgrade suggestions are shown
**When** I view suggestions
**Then** I can:
  - Dismiss suggestion (don't show again for 30 days)
  - View upgrade options
  - Proceed with upgrade
  - See upgrade later (remind me in X days)
**And** suggestions respect my preferences
**And** suggestions don't become annoying

**Technical Notes:**
- Upgrade suggestion algorithm: Analyzes usage patterns to identify upgrade opportunities
- Suggestion triggers: 80%+ usage, high overages, feature needs
- Suggestion display: Prominent but non-intrusive, contextual to usage
- Upgrade flow: Direct link to upgrade process (Story 10.6)
- Suggestion preferences: User can dismiss or defer suggestions

---

### Story 10.12: Upgrade Value Comparison and Feature Showcase

**Priority:** P1 (Post-MVP - Usage tracking can be basic, billing already in 1-7)

As a user,
I want to see the value of upgrading with feature comparison,
So that I can make an informed decision about upgrading my plan.

**Acceptance Criteria:**

**Given** I view upgrade options
**When** I see upgrade suggestions or click "Upgrade Plan"
**Then** I see feature comparison:
  - **Plan Comparison Table:**
    - Current plan vs. available plans
    - Features listed side-by-side
    - Limits compared (articles, keyword research, etc.)
    - Pricing compared
  - **Feature Highlights:**
    - New features I'll get
    - Limit increases
    - Feature unlocks
  - **Value Proposition:**
    - Why upgrade makes sense
    - Cost savings (if applicable)
    - Feature benefits
**And** comparison is clear and easy to understand

**Given** I am on Starter plan
**When** I view upgrade to Pro
**Then** I see comparison:
  - **Articles:** 10 → 50 (5× increase)
  - **Keyword Research:** 50 → 500 (10× increase)
  - **CMS Connections:** 1 → 3 (3× increase)
  - **Projects:** 1 → 5 (5× increase)
  - **Stores:** 1 → 3 (3× increase)
  - **Team Members:** 1 → 3 (3× increase)
  - **New Features:**
    - ✅ Revenue Attribution (NEW)
    - ✅ Multi-Store Management (NEW)
    - ✅ Higher API Limits (NEW)
  - **Pricing:** $89/month → $220/month
**And** value is clearly demonstrated

**Given** I am on Pro plan
**When** I view upgrade to Agency
**Then** I see comparison:
  - **Articles:** 50 → 150 (3× increase)
  - **Keyword Research:** 500 → Unlimited
  - **CMS Connections:** 3 → Unlimited
  - **Projects:** 5 → Unlimited
  - **Stores:** 3 → Unlimited
  - **Team Members:** 3 → Unlimited
  - **New Features:**
    - ✅ White-Label & Custom Domain (NEW)
    - ✅ Client Portal (NEW)
    - ✅ Unlimited API Calls (NEW)
    - ✅ Priority Support (NEW)
  - **Pricing:** $220/month → $399/month
**And** value is clearly demonstrated

**Given** I want to see upgrade benefits
**When** I view upgrade options
**Then** I can see:
  - **Feature Showcase:**
    - Screenshots or demos of new features
    - Feature descriptions
    - Use cases
  - **Testimonials:** (if available)
    - Customer success stories
    - ROI examples
  - **ROI Calculator:**
    - Time saved with upgrade
    - Cost savings
    - Revenue impact (if applicable)
**And** benefits are compelling

**Given** I want to calculate upgrade value
**When** I view upgrade options
**Then** I can see:
  - **Cost Comparison:**
    - Current plan cost
    - Upgrade plan cost
    - Overage savings (if applicable)
    - Net cost difference
  - **Value Calculation:**
    - Additional articles value
    - Feature value
    - Time saved value
    - ROI estimate
**And** value calculation helps justify upgrade

**Given** I want to proceed with upgrade
**When** I click "Upgrade Now"
**Then** I am taken to upgrade flow (Story 10.6)
**And** upgrade process is smooth
**And** I can complete upgrade in < 2 minutes

**Technical Notes:**
- Feature comparison: Side-by-side plan comparison table
- Value calculation: ROI and cost savings calculations
- Feature showcase: Visual demonstrations of new features
- Upgrade flow: Direct integration with upgrade process (Story 10.6)
- Comparison data: Stored in plan configuration, dynamically generated

---

### Epic 11: API & Webhook Integrations
**User Outcome:** Developers can integrate with the platform via REST API, manage API keys, and configure webhooks for custom integrations.

**FRs covered:** FR100-FR104

**Key Capabilities:**
- Generate API keys for programmatic access
- REST API endpoints for core operations (content generation, publishing, research)
- Enforce rate limiting per API key
- Receive webhook notifications from external systems
- Configure webhook endpoints for custom integrations

**Dependencies:** Epic 1 (requires authentication), Epic 4A (requires content generation API), Epic 5 (requires publishing API)

**Success Metrics:**
- 99%+ webhook processing success rate (NFR-I4)
- API response times < 2 seconds (NFR-P5)

### Story 11.1: API Key Generation and Management

**Priority:** P1 (Post-MVP - Developer feature, not core promise)

As a user,
I want to generate API keys for programmatic access,
So that I can integrate Infin8Content with my custom applications and workflows.

**Acceptance Criteria:**

**Given** I am an organization owner or team member with API access (Pro/Agency plans)
**When** I navigate to Settings > API > API Keys
**Then** I can see:
  - List of existing API keys (if any)
  - API key name, created date, last used date
  - API key status (Active, Revoked)
  - Quick actions: "Revoke", "View Details", "Copy Key"
  - "Generate New API Key" button
**And** I can manage my API keys

**Given** I want to generate a new API key
**When** I click "Generate New API Key"
**Then** I can configure:
  - API key name (e.g., "Production API", "Development API", "Zapier Integration")
  - Description (optional, what this key is for)
  - Permissions/scopes (if applicable):
    - Read articles
    - Create articles
    - Publish articles
    - Keyword research
    - View analytics
  - Expiration date (optional, or never expires)
**And** I can save the configuration

**Given** I save API key configuration
**When** API key is generated
**Then** the system:
  - Generates unique API key (secure random string, 32+ characters)
  - Hashes API key with bcrypt (NFR-S6: API keys hashed)
  - Stores hashed key in `api_keys` table
  - Links key to organization
  - Sets key status to "Active"
**And** I see the API key displayed ONCE:
  - Full API key shown (e.g., "inf8_live_abc123xyz789...")
  - Warning: "This key will only be shown once. Copy it now."
  - "Copy Key" button
  - "I've Copied the Key" confirmation
**And** after confirmation, the key is never shown again (only hashed version stored)

**Given** I have generated API keys
**When** I view API Keys
**Then** I can see:
  - API key name and description
  - Created date
  - Last used date (if used)
  - Status (Active, Revoked)
  - Usage count (if tracked)
  - Expiration date (if set)
**And** I can:
  - Revoke API key (immediately invalidates key)
  - View key details
  - See usage statistics (if available)
**And** revoked keys cannot be reactivated (must generate new key)

**Given** I want to revoke an API key
**When** I click "Revoke" on an API key
**Then** I see confirmation: "Are you sure you want to revoke this API key? This action cannot be undone."
**And** if I confirm:
  - API key status changes to "Revoked"
  - Key is immediately invalidated
  - Any requests using this key will fail with "401 Unauthorized"
  - I receive confirmation: "API key revoked successfully"
**And** if I cancel, no changes are made

**Given** API key expires
**When** expiration date is reached
**Then** the system:
  - Automatically revokes the key
  - Sets status to "Expired"
  - Blocks API requests using the key
  - Sends notification: "API key '[Name]' has expired"
**And** I can generate a new key to replace it

**Technical Notes:**
- API key generation: Secure random string (32+ characters, alphanumeric + special chars)
- Key hashing: Bcrypt hashing before storage (NFR-S6)
- Key storage: `api_keys` table with organization_id, hashed_key, name, status, created_at, expires_at
- Key display: Shown once only, never stored in plain text
- Key revocation: Immediate invalidation, cannot be reactivated

---

### Story 11.2: REST API Endpoints for Core Operations

**Priority:** P1 (Post-MVP - Developer feature, not core promise)

As a developer,
I want to access REST API endpoints for core operations,
So that I can programmatically generate content, publish articles, and perform research.

**Acceptance Criteria:**

**Given** I have a valid API key (Story 11.1)
**When** I make API requests
**Then** I authenticate using:
  - API key in Authorization header: `Authorization: Bearer {api_key}`
  - Or API key as query parameter: `?api_key={api_key}` (less secure, not recommended)
**And** authentication is validated
**And** if authentication fails, I receive "401 Unauthorized" error

**Given** I want to generate an article via API
**When** I call `POST /api/v1/articles`
**Then** I can provide:
  - `keyword` (required): Target keyword for article
  - `length` (optional): Target word count (1500, 2000, 3000, custom)
  - `style` (optional): Writing style/tone
  - `project_id` (optional): Assign to project
  - `custom_instructions` (optional): Additional requirements
**And** API returns:
  - `article_id`: Unique article identifier
  - `status`: "queued" or "generating"
  - `estimated_time`: Estimated completion time
  - `queue_position`: Position in queue (if queued)
**And** article generation is queued via Inngest (async)
**And** I can poll for status or use webhooks for completion notification

**Given** I want to check article status
**When** I call `GET /api/v1/articles/{article_id}`
**Then** I receive article details:
  - `article_id`, `title`, `status`
  - `progress`: Generation progress (if in progress)
  - `content`: Article content (if completed)
  - `metadata`: SEO data, citations, etc.
  - `created_at`, `updated_at`
**And** response is JSON formatted
**And** I can see current generation status

**Given** I want to publish an article via API
**When** I call `POST /api/v1/articles/{article_id}/publish`
**Then** I can provide:
  - `cms_connection_id` (required): Which CMS to publish to
  - `status` (optional): "draft" or "publish" (default: "publish")
  - `category` (optional): WordPress category
  - `tags` (optional): WordPress tags
  - `schedule_date` (optional): Schedule for future publishing
**And** API returns:
  - `publishing_id`: Unique publishing identifier
  - `status`: "queued" or "publishing"
  - `published_url`: URL (if published successfully)
**And** publishing is queued via Inngest (async)
**And** I can poll for status or use webhooks

**Given** I want to perform keyword research via API
**When** I call `POST /api/v1/keywords/research`
**Then** I can provide:
  - `keyword` (required): Seed keyword to research
  - `depth` (optional): Research depth (basic, standard, deep)
  - `filters` (optional): Search volume, difficulty filters
**And** API returns:
  - `research_id`: Unique research identifier
  - `status`: "in_progress" or "completed"
  - `results`: Keyword research results (if completed)
  - `keywords`: Array of keywords with volume, difficulty, trend data
**And** research is processed (sync or async depending on depth)
**And** results are returned in JSON format

**Given** I want to view analytics via API
**When** I call `GET /api/v1/analytics/articles/{article_id}`
**Then** I receive analytics data:
  - `article_id`, `title`
  - `views`: Total page views
  - `rankings`: Keyword rankings
  - `conversions`: Conversions attributed
  - `revenue`: Revenue attributed (if applicable)
  - `trends`: Performance trends over time
**And** data is JSON formatted
**And** I can filter by date range (query parameters)

**Given** I want to list articles via API
**When** I call `GET /api/v1/articles`
**Then** I can use query parameters:
  - `status`: Filter by status (draft, published, etc.)
  - `project_id`: Filter by project
  - `limit`: Results per page (default: 25, max: 100)
  - `offset`: Pagination offset
  - `sort`: Sort order (created_at, updated_at, title)
**And** API returns:
  - `articles`: Array of article summaries
  - `total`: Total count
  - `limit`, `offset`: Pagination info
  - `has_more`: Whether more results available
**And** response is paginated
**And** I can paginate through results

**Given** API requests are made
**When** requests are processed
**Then** the system:
  - Validates API key
  - Checks rate limits (Story 11.3)
  - Processes request
  - Returns JSON response
  - Logs API usage for tracking
**And** API responses follow standard format:
  - Success: `{ "data": {...}, "status": "success" }`
  - Error: `{ "error": {...}, "status": "error" }`
**And** error responses include error code, message, and actionable steps

**Technical Notes:**
- REST API: Next.js API routes (`/app/api/v1/[resource]/route.ts`)
- Authentication: API key in Authorization header (Bearer token)
- API versioning: URL-based (`/api/v1/...`) for future compatibility
- Response format: Standardized JSON with data/error structure
- Async operations: Article generation and publishing queued via Inngest
- API documentation: OpenAPI/Swagger specification for API docs

---

### Story 11.3: Rate Limiting Per API Key

**Priority:** P1 (Post-MVP - Developer feature, not core promise)

As the system,
I want to enforce rate limiting per API key,
So that I can prevent API abuse and ensure fair usage across organizations.

**Acceptance Criteria:**

**Given** API requests are made
**When** requests are received
**Then** the system checks rate limits:
  - Rate limits are per API key
  - Rate limits are based on plan tier:
    - Starter: 100 API calls/month
    - Pro: 1,000 API calls/month
    - Agency: Unlimited API calls
  - Rate limits are tracked per billing period (monthly)
**And** rate limit checks happen before request processing
**And** rate limit data is stored in `api_rate_limits` table

**Given** I make API requests within my rate limit
**When** requests are processed
**Then** requests succeed normally
**And** rate limit usage is incremented
**And** I can see remaining API calls in response headers:
  - `X-RateLimit-Limit`: Total limit (e.g., "1000")
  - `X-RateLimit-Remaining`: Remaining calls (e.g., "847")
  - `X-RateLimit-Reset`: Reset timestamp (e.g., "1735689600")
**And** headers help me monitor my usage

**Given** I exceed my rate limit
**When** I make an API request that would exceed the limit
**Then** the request is rejected with:
  - HTTP status: "429 Too Many Requests"
  - Error response:
    ```json
    {
      "error": {
        "code": "RATE_LIMIT_EXCEEDED",
        "message": "Rate limit exceeded. You have used 1000 of 1000 API calls this month.",
        "rateLimit": {
          "limit": 1000,
          "remaining": 0,
          "resetAt": "2024-12-31T23:59:59Z"
        },
        "actionableSteps": [
          "Wait for rate limit reset (next billing period)",
          "Upgrade plan for higher limits",
          "Contact support for temporary limit increase"
        ]
      }
    }
    ```
**And** request is not processed
**And** I can see when rate limit resets

**Given** rate limit resets
**When** new billing period starts
**Then** rate limit counters reset to 0
**And** previous period's usage is archived
**And** new period tracking begins
**And** API calls are available again

**Given** I want to see my rate limit usage
**When** I view API key details or make API requests
**Then** I can see:
  - Current usage: "847 of 1,000 API calls used"
  - Remaining calls: "153 calls remaining"
  - Reset date: "Resets on December 31, 2024"
  - Usage percentage: "84.7% used"
**And** I can see usage trends
**And** I receive alerts when approaching limit (90% threshold)

**Given** I want to configure rate limit behavior
**When** I view API settings
**Then** I can see:
  - Current rate limit (based on plan)
  - Usage this period
  - Reset date
  - Options to upgrade plan (if on limited plan)
**And** I can understand my rate limit constraints

**Technical Notes:**
- Rate limiting: Per API key, per billing period
- Rate limit storage: `api_rate_limits` table tracks usage per key per period
- Rate limit headers: Standard HTTP rate limit headers (X-RateLimit-*)
- Rate limit enforcement: Middleware checks before request processing
- Plan-based limits: Starter (100/month), Pro (1,000/month), Agency (unlimited)

---

### Story 11.4: Webhook Receiving from External Systems

**Priority:** P1 (Post-MVP - Developer feature, not core promise)

As the system,
I want to receive webhook notifications from external systems,
So that I can integrate with third-party services and respond to external events.

**Acceptance Criteria:**

**Given** external systems need to send webhooks to Infin8Content
**When** webhooks are configured
**Then** the system provides webhook endpoints:
  - `POST /api/webhooks/receive/{webhook_id}`
  - Webhook ID is unique per organization
  - Webhook URL is shareable with external systems
**And** webhooks can be configured per organization

**Given** an external system sends a webhook
**When** webhook is received
**Then** the system:
  - Validates webhook signature (HMAC if configured)
  - Parses webhook payload (JSON format)
  - Identifies webhook source (if signature validation passes)
  - Processes webhook event
  - Returns "200 OK" response
**And** webhook processing is logged
**And** webhook events are stored in `webhook_events` table

**Given** webhook signature validation
**When** webhook is received
**Then** the system:
  - Extracts signature from headers (e.g., `X-Webhook-Signature`)
  - Calculates expected signature using webhook secret (HMAC-SHA256)
  - Compares signatures (constant-time comparison)
  - If signatures match: Process webhook
  - If signatures don't match: Reject with "401 Unauthorized"
**And** signature validation prevents unauthorized webhooks
**And** webhook secret is stored encrypted (AES-256)

**Given** webhook is processed
**When** webhook event is handled
**Then** the system:
  - Stores webhook event (payload, source, timestamp)
  - Triggers appropriate action based on webhook type:
    - Order created (e-commerce) → Revenue attribution (Epic 7)
    - Payment status (Stripe) → Account activation/suspension (Epic 1)
    - CMS publish status → Update article status
    - Custom webhook → User-defined handler
  - Processes event asynchronously (via Inngest if needed)
**And** webhook processing is reliable
**And** webhook events are idempotent (duplicate events handled gracefully)

**Given** webhook processing fails
**When** an error occurs
**Then** the system:
  - Logs error details
  - Stores failed webhook for retry
  - Returns appropriate HTTP status (500 for server errors)
  - Retries processing (3 attempts with exponential backoff)
**And** failed webhooks are visible in webhook history
**And** I can manually retry failed webhooks

**Given** I want to see webhook history
**When** I view webhook settings
**Then** I can see:
  - List of received webhooks
  - Webhook source, payload, timestamp
  - Processing status (Success, Failed, Pending)
  - Processing duration
  - Error details (if failed)
**And** I can filter by date, status, source
**And** I can view webhook payload details

**Technical Notes:**
- Webhook endpoints: `POST /api/webhooks/receive/{webhook_id}`
- Signature validation: HMAC-SHA256 signature verification
- Webhook storage: `webhook_events` table with payload, source, status, timestamp
- Idempotency: Duplicate webhook handling (check event ID if provided)
- Retry logic: 3 attempts with exponential backoff for failed webhooks

---

### Story 11.5: Webhook Endpoint Configuration for Custom Integrations

**Priority:** P1 (Post-MVP - Developer feature, not core promise)

As a user,
I want to configure webhook endpoints for custom integrations,
So that external systems can notify me when events occur in Infin8Content.

**Acceptance Criteria:**

**Given** I am an organization owner
**When** I navigate to Settings > Integrations > Webhooks
**Then** I can see:
  - List of configured webhook endpoints (if any)
  - Webhook name, URL, status, last triggered date
  - Quick actions: "Test", "Edit", "Delete", "View History"
  - "Create Webhook" button
**And** I can manage webhook endpoints

**Given** I want to create a webhook endpoint
**When** I click "Create Webhook"
**Then** I can configure:
  - **Webhook Name:** Descriptive name (e.g., "Zapier Integration", "Custom CMS")
  - **Webhook URL:** Endpoint URL where webhooks will be sent
  - **Events:** Which events trigger this webhook:
    - Article generated
    - Article published
    - Article status changed
    - Keyword research completed
    - Revenue attributed
    - Payment received
    - Usage limit reached
    - Other custom events
  - **HTTP Method:** POST (default)
  - **Headers:** Custom headers to include (optional)
  - **Secret:** Webhook secret for HMAC signature (optional, auto-generated if not provided)
  - **Active Status:** Enable/disable webhook
**And** I can save the webhook configuration

**Given** I configure a webhook endpoint
**When** I save the configuration
**Then** the system:
  - Validates webhook URL (must be HTTPS, accessible)
  - Generates webhook secret (if not provided)
  - Stores webhook configuration in `webhook_endpoints` table
  - Tests webhook endpoint (optional test call)
  - Sets webhook status to "Active" (if test succeeds)
**And** webhook is ready to receive events
**And** I can see webhook status

**Given** a configured event occurs
**When** event triggers webhook
**Then** the system:
  - Identifies configured webhooks for this event type
  - Prepares webhook payload:
    - Event type
    - Event data (article details, status, etc.)
    - Timestamp
    - Event ID (for idempotency)
  - Signs payload with HMAC-SHA256 (using webhook secret)
  - Sends HTTP POST request to webhook URL
  - Includes signature in `X-Webhook-Signature` header
  - Waits for response (timeout: 10 seconds)
**And** webhook delivery is logged
**And** webhook status is updated (success/failure)

**Given** webhook delivery succeeds
**When** webhook endpoint returns 200 OK
**Then** the system:
  - Marks webhook as "Delivered"
  - Logs delivery timestamp
  - Updates webhook statistics (success count)
**And** webhook is considered successfully delivered
**And** no retry is needed

**Given** webhook delivery fails
**When** webhook endpoint returns error or times out
**Then** the system:
  - Marks webhook as "Failed"
  - Logs error details
  - Retries delivery (3 attempts with exponential backoff)
  - If all retries fail: Marks as "Failed Permanently"
  - Stores failed webhook for manual retry
**And** I can see failed webhooks in webhook history
**And** I can manually retry failed webhooks

**Given** I want to test a webhook
**When** I click "Test Webhook"
**Then** the system:
  - Sends test webhook to configured URL
  - Uses test payload (sample event data)
  - Waits for response
  - Shows test result: "Success" or "Failed" with error details
**And** test helps verify webhook configuration
**And** I can fix configuration if test fails

**Given** I want to manage webhooks
**When** I view webhook endpoints
**Then** I can:
  - Edit webhook configuration (URL, events, headers)
  - Enable/disable webhook (without deleting)
  - Delete webhook (removes configuration)
  - View webhook history (all events sent)
  - View webhook statistics (success rate, delivery times)
**And** changes take effect immediately
**And** disabled webhooks don't receive events

**Given** I want to see webhook delivery history
**When** I view webhook details
**Then** I can see:
  - List of all webhook deliveries
  - Delivery timestamp
  - Event type and payload
  - Delivery status (Success, Failed, Pending)
  - Response code and response time
  - Error details (if failed)
**And** I can filter by date, status, event type
**And** I can retry failed deliveries

**Technical Notes:**
- Webhook configuration: Stored in `webhook_endpoints` table
- Webhook delivery: HTTP POST to configured URL with HMAC signature
- Event filtering: Webhooks only receive configured event types
- Retry logic: 3 attempts with exponential backoff for failed deliveries
- Webhook history: `webhook_deliveries` table tracks all delivery attempts
- HMAC signature: X-Webhook-Signature header for webhook verification

---

### Epic 12: Onboarding & Feature Discovery
**User Outcome:** New users can discover features through guided tours, tutorials, and help documentation.

**FRs covered:** FR118-FR120, FR135-FR137

**Key Capabilities:**
- Pre-payment information pages (pricing, features, case studies)
- Post-payment guided tours and tutorials
- Feature discovery mechanisms for new users
- Help documentation and support resources
- 5-step onboarding flow (Welcome, Persona Selection, CMS Connection, First Article, Dashboard Tour)

**Dependencies:** Epic 1 (requires payment flow), Epic 2 (requires dashboard), Epic 3-4A (requires content generation for first article)

**Success Metrics:**
- 80%+ activation rate (users who publish 1+ article)
- 70%+ complete onboarding flow
- < 10 minutes time to first article

### Story 12.1: Pre-Payment Information Pages (Pricing, Features, Case Studies)

**Priority:** P1 (Post-MVP - UX polish, not blocking)

As a visitor,
I want to view information about Infin8Content without creating an account,
So that I can understand the product, pricing, and value before committing to payment.

**Acceptance Criteria:**

**Given** I am a visitor to the website
**When** I navigate to the homepage or pricing page
**Then** I can see:
  - **Homepage:**
    - Value proposition and key benefits
    - Feature overview
    - Pricing tiers (Starter, Pro, Agency)
    - Social proof (testimonials, customer count)
    - "Get Started" or "View Pricing" CTA
  - **Pricing Page:**
    - Detailed plan comparison table
    - Feature lists per plan
    - Pricing (monthly and annual)
    - "Start Free Trial" or "Get Started" buttons (note: no free trial, payment required)
  - **Features Page:**
    - Detailed feature descriptions
    - Feature screenshots or demos
    - Use cases per persona
  - **Case Studies Page:**
    - Customer success stories
    - ROI examples
    - Before/after comparisons
**And** I can navigate between pages
**And** I don't need to create an account to view information

**Given** I want to see pricing details
**When** I view the pricing page
**Then** I can see:
  - **Plan Comparison Table:**
    - Starter, Pro, Agency plans side-by-side
    - Monthly and annual pricing
    - Feature lists (checkmarks for included features)
    - Limits per plan (articles, keyword research, etc.)
    - "Get Started" buttons for each plan
  - **Pricing Details:**
    - Monthly vs. annual savings highlighted
    - Overage rates explained
    - Upgrade/downgrade policy
    - Refund policy (if applicable)
**And** pricing is clear and transparent
**And** I can click "Get Started" to begin signup

**Given** I want to see features
**When** I view the features page
**Then** I can see:
  - **Feature Categories:**
    - Content Generation (article generation, product descriptions)
    - Research & Discovery (keyword research, SERP analysis)
    - Publishing & Distribution (CMS publishing, scheduling)
    - Analytics & Tracking (performance metrics, revenue attribution)
    - White-Label (for agencies)
  - **Feature Details:**
    - Feature descriptions
    - Screenshots or demos
    - Use cases
    - Benefits
**And** features are clearly explained
**And** I can understand what the product does

**Given** I want to see case studies
**When** I view the case studies page
**Then** I can see:
  - **Customer Success Stories:**
    - Customer name and industry
    - Challenge they faced
    - How Infin8Content solved it
    - Results (time saved, content output, ROI)
    - Testimonials
  - **ROI Examples:**
    - Cost savings calculations
    - Revenue impact
    - Time savings
  - **Before/After Comparisons:**
    - Content output before vs. after
    - Traffic growth
    - Ranking improvements
**And** case studies are compelling and credible
**And** I can see real-world value

**Given** I want to get started
**When** I click "Get Started" or "Start Now"
**Then** I am directed to:
  - Account creation page (email/password or OAuth)
  - Plan selection (if not selected)
  - Payment page
  - Post-payment onboarding (after payment)
**And** signup flow is clear and straightforward
**And** I understand payment is required before dashboard access

**Technical Notes:**
- Pre-payment pages: Public pages, no authentication required
- Content: Static or CMS-managed content (markdown, MDX, or CMS)
- SEO optimization: Pages optimized for search engines
- Analytics: Track page views, conversion rates, signup sources

---

### Story 12.2: Post-Payment Onboarding Welcome and Persona Selection

**Priority:** P1 (Post-MVP - UX polish, not blocking)

As a new user,
I want to complete onboarding after payment,
So that I can get started with Infin8Content and configure my account.

**Acceptance Criteria:**

**Given** I have completed payment (Epic 1)
**When** I first access the dashboard
**Then** I see onboarding welcome screen:
  - **Welcome Message:** "Welcome to Infin8Content, [Name]!"
  - **Value Reminder:** "You're ready to transform your content workflow from 10 days to 5 minutes"
  - **Social Proof:** "Join 1,000+ content creators saving 10+ hours/week"
  - **Progress Indicator:** "Step 1 of 5" (if multi-step onboarding)
  - **CTA:** "Get Started" button (primary)
  - **Skip Option:** "Skip onboarding" link (subtle, bottom)
**And** onboarding is optional (can be skipped)
**And** I can access dashboard even if I skip

**Given** I proceed with onboarding
**When** I click "Get Started"
**Then** I see persona selection step:
  - **Three Persona Cards:**
    - **Agency (Sarah):** "Manage content for multiple clients"
      - Key features: White-label, client portals, multi-project management
      - Example: "Resell content creation to 10+ clients"
    - **E-Commerce (Marcus):** "Drive sales with content"
      - Key features: Revenue attribution, product descriptions, store integration
      - Example: "Prove content ROI with revenue tracking"
    - **SaaS/Growth (Jessica):** "Scale organic traffic"
      - Key features: Traffic growth, ranking tracking, signup attribution
      - Example: "10K visitors/month through content"
  - **Card Design:**
    - Persona icon and name
    - Brief description (2-3 sentences)
    - Key features (bullet list)
    - Example use case
    - "Select" button
  - **Selection State:**
    - Selected card: Highlighted border, checkmark icon
    - "Continue" button enabled after selection
**And** I can select my primary persona
**And** selection customizes my dashboard (Epic 2.2)

**Given** I select a persona
**When** I click "Continue"
**Then** persona selection is saved to my profile
**And** dashboard is customized for selected persona (Epic 2.2)
**And** I proceed to next onboarding step (CMS connection or first article)
**And** I can change persona later in Settings

**Given** I want to skip persona selection
**When** I click "Skip for now"
**Then** persona selection is skipped
**And** default persona is used (or no persona-specific customization)
**And** I can set persona later in Settings
**And** I proceed to next onboarding step

**Given** onboarding is in progress
**When** I view onboarding
**Then** I can see:
  - Progress indicator (Step X of Y)
  - Current step highlighted
  - Completed steps marked with checkmarks
  - Remaining steps shown
**And** progress is clear and motivating
**And** I can navigate back to previous steps (if needed)

**Technical Notes:**
- Onboarding flow: Multi-step wizard, optional and skippable
- Persona selection: Stored in user profile or organization settings
- Progress tracking: Stored in `user_onboarding` table or user preferences
- Dashboard customization: Persona selection triggers dashboard customization (Epic 2.2)

---

### Story 12.3: Guided CMS Connection During Onboarding

**Priority:** P1 (Post-MVP - UX polish, not blocking)

As a new user,
I want to connect my CMS during onboarding,
So that I can publish articles immediately after creating them.

**Acceptance Criteria:**

**Given** I am in onboarding (after persona selection)
**When** I reach the CMS connection step
**Then** I see:
  - **Step Title:** "Connect Your CMS" (Step 3 of 5)
  - **CMS Options:** Cards/logos for supported platforms:
    - WordPress
    - Shopify
    - Webflow
    - Ghost
    - Wix
    - Squarespace
    - Blogger
    - Custom Webhook
  - **Help Text:** "You can connect multiple CMS platforms later in Settings"
  - **Skip Option:** "Skip for now" link
  - **Continue Button:** "Continue" (works even if skipped)
**And** I can connect a CMS or skip this step

**Given** I want to connect WordPress
**When** I click the WordPress card
**Then** I see connection modal:
  - **Connection Form:**
    - Site URL input
    - Username input
    - Application Password input
    - "Test Connection" button
    - "Connect" button
  - **Instructions:** Step-by-step guide for getting WordPress Application Password
  - **Help Link:** "How to get Application Password" (opens help doc)
**And** I can complete WordPress connection (Story 5.1)
**And** connection status is shown (Connected, Error, Pending)

**Given** I want to connect Shopify
**When** I click the Shopify card
**Then** I am redirected to Shopify OAuth flow:
  - Shopify authorization page
  - I authorize the app
  - I am redirected back to Infin8Content
  - Connection is established
  - I see "Connected" status
**And** OAuth flow completes (Story 5.1)
**And** I return to onboarding

**Given** I connect a CMS successfully
**When** connection is established
**Then** I see:
  - Success message: "WordPress connected successfully!"
  - Connected CMS shown with checkmark
  - "Continue" button to proceed
**And** connection is saved
**And** I can use this CMS for publishing (Epic 5)

**Given** I want to skip CMS connection
**When** I click "Skip for now"
**Then** CMS connection step is skipped
**And** I can connect CMS later in Settings > Integrations
**And** I proceed to next onboarding step
**And** onboarding continues without blocking

**Given** CMS connection fails
**When** connection attempt fails
**Then** I see:
  - Error message: "Connection failed: [specific reason]"
  - Troubleshooting steps
  - "Retry" button
  - "Skip for now" option
**And** I can retry or skip
**And** onboarding is not blocked by connection failure

**Technical Notes:**
- CMS connection: Uses same connection flow as Story 5.1
- Onboarding integration: CMS connection embedded in onboarding flow
- Skip option: Onboarding continues even if CMS connection is skipped
- Connection storage: CMS connections saved to `cms_connections` table

---

### Story 12.4: Guided First Article Creation Tutorial

**Priority:** P1 (Post-MVP - UX polish, not blocking)

As a new user,
I want to create my first article with guided steps,
So that I learn how to use Infin8Content and see immediate value.

**Acceptance Criteria:**

**Given** I am in onboarding (after CMS connection or persona selection)
**When** I reach the "First Article" step
**Then** I see guided article creation wizard:
  - **Step 1: Enter Keyword**
    - Input field with placeholder: "e.g., 'best running shoes for marathons'"
    - Example keywords shown
    - Tooltip: "Enter a keyword related to your content topic"
    - "Next" button
  - **Step 2: Review Keyword Research**
    - Keyword research results displayed (auto-generated)
    - Top keywords highlighted
    - Tooltip: "These are the best keywords to target"
    - "Next" button
  - **Step 3: Select Article Structure**
    - Structure options: "Pillar Article", "Supporting Article", "How-To Guide"
    - Visual cards showing structure types
    - Tooltip: "Choose the structure that fits your content strategy"
    - "Next" button
  - **Step 4: Watch Article Generation**
    - Real-time progress display
    - Step-by-step narrative: "Researching...", "Writing Introduction...", "Writing Section 3..."
    - Progress bar and estimated time
    - Tooltip: "Your article is being generated. This usually takes 3-5 minutes."
  - **Step 5: Review and Edit**
    - Generated article displayed
    - Edit options highlighted
    - Tooltip: "You can edit any section before publishing"
    - "Next" button
  - **Step 6: Publish Article**
    - Publishing options (if CMS connected)
    - Or "Save as Draft" option
    - Tooltip: "Publish now or save for later"
    - "Complete" button
**And** each step has clear guidance
**And** I can navigate between steps

**Given** I complete the first article
**When** article generation completes
**Then** I see success celebration:
  - "🎉 Your first article is ready!"
  - Article title and word count displayed
  - "View Article" and "Publish Article" buttons
  - "Continue to Dashboard" button
**And** success moment is highlighted
**And** I feel accomplished

**Given** I want to skip the tutorial
**When** I click "Skip tutorial"
**Then** tutorial is skipped
**And** I can create articles later from the dashboard
**And** I proceed to next onboarding step (dashboard tour)
**And** onboarding continues without blocking

**Given** I want help during tutorial
**When** I view any step
**Then** I can:
  - See tooltips with guidance
  - Click "Learn more" links (opens help docs)
  - See example content
  - Get contextual help
**And** help is always available
**And** I don't feel lost

**Given** tutorial is completed
**When** I finish first article creation
**Then** I have:
  - Created my first article
  - Learned the article creation process
  - Seen the platform in action
  - Gained confidence to use the platform
**And** I proceed to dashboard tour (if enabled)
**And** onboarding progress is saved

**Technical Notes:**
- Guided tutorial: Step-by-step wizard for first article creation
- Article generation: Uses same process as Epic 4A (section-by-section)
- Progress tracking: Real-time updates via websockets
- Tutorial storage: Tutorial completion tracked in user preferences
- Skip option: Tutorial can be skipped, articles can be created later

---

### Story 12.5: Dashboard Tour and Feature Discovery

**Priority:** P1 (Post-MVP - UX polish, not blocking)

As a new user,
I want to take a guided tour of the dashboard,
So that I can discover key features and understand how to navigate the platform.

**Acceptance Criteria:**

**Given** I have completed onboarding steps (persona selection, CMS connection, first article)
**When** I reach the dashboard tour step
**Then** I see tour invitation:
  - "Take a quick tour of your dashboard"
  - "Skip tour" option
  - "Start Tour" button
**And** tour is optional
**And** I can skip and access dashboard immediately

**Given** I start the dashboard tour
**When** tour begins
**Then** I see modal overlay with highlights:
  - **Tour Step 1: Dashboard Overview**
    - Dashboard widgets highlighted
    - Tooltip: "Your dashboard shows key metrics and quick actions"
    - "Next" button
  - **Tour Step 2: Navigation Sidebar**
    - Sidebar highlighted
    - Tooltip: "Navigate to Research, Write, Publish, and Track sections"
    - "Next" button
  - **Tour Step 3: Quick Actions**
    - Quick action buttons highlighted
    - Tooltip: "Quick access to common tasks like creating articles"
    - "Next" button
  - **Tour Step 4: Usage Dashboard**
    - Usage widget highlighted
    - Tooltip: "Monitor your usage and plan limits here"
    - "Next" button
  - **Tour Step 5: Settings**
    - Settings link highlighted
    - Tooltip: "Configure your account, integrations, and preferences"
    - "Complete Tour" button
**And** each step highlights relevant UI elements
**And** I can navigate between steps

**Given** I complete the tour
**When** I click "Complete Tour"
**Then** tour modal closes
**And** I see: "You're all set! Start creating content."
**And** I can access the full dashboard
**And** tour completion is saved (won't show again)

**Given** I want to skip the tour
**When** I click "Skip tour" or click outside modal
**Then** tour is cancelled
**And** I can access the dashboard immediately
**And** tour can be accessed later from Help menu

**Given** I want to retake the tour
**When** I view Help menu or Settings
**Then** I can click "Take Dashboard Tour"
**And** tour starts again
**And** I can complete or skip the tour

**Given** tour highlights features
**When** I view tour steps
**Then** highlights are:
  - Clear and visible (overlay with spotlight effect)
  - Non-intrusive (don't block all UI)
  - Animated (smooth transitions between steps)
  - Informative (tooltips explain each feature)
**And** tour is engaging and helpful

**Technical Notes:**
- Dashboard tour: Modal overlay with step-by-step highlights
- Tour library: Use library like react-joyride or similar for guided tours
- Tour storage: Tour completion tracked in user preferences
- Tour accessibility: Keyboard navigation, screen reader support
- Tour customization: Persona-specific tours (different features for different personas)

---

### Story 12.6: Feature Discovery Mechanisms for New Users

**Priority:** P1 (Post-MVP - UX polish, not blocking)

As a new user,
I want to discover features I haven't used yet,
So that I can get maximum value from Infin8Content.

**Acceptance Criteria:**

**Given** I am a new user
**When** I use the platform
**Then** the system identifies unused features:
  - Features I haven't accessed
  - Features available in my plan
  - Features that would benefit me (based on persona or usage patterns)
**And** feature discovery suggestions are shown

**Given** unused features are identified
**When** I view the dashboard
**Then** I can see feature discovery prompts:
  - **Feature Cards:** Cards highlighting unused features
    - Feature name and icon
    - Brief description
    - Benefit statement
    - "Try It" or "Learn More" button
  - **Contextual Suggestions:** Suggestions based on my actions
    - "You've created 5 articles. Try bulk publishing to save time."
    - "You're managing multiple stores. Try revenue attribution to track ROI."
  - **Feature Badges:** Badges on features I haven't used
    - "New" badge on unused features
    - "Try" badge on recommended features
**And** suggestions are helpful, not annoying
**And** I can dismiss suggestions

**Given** I want to discover features
**When** I view "Discover Features" or "What's New"
**Then** I can see:
  - **Feature Library:**
    - All available features
    - Features I've used (marked)
    - Features I haven't used (highlighted)
    - Feature descriptions and tutorials
  - **Recommended Features:**
    - Features recommended for my persona
    - Features recommended based on usage
    - Features that complement what I'm already using
  - **Feature Tutorials:**
    - Quick tutorials for each feature
    - Video demos (if available)
    - Step-by-step guides
**And** I can explore features at my own pace

**Given** I want to learn about a feature
**When** I click "Learn More" on a feature
**Then** I see:
  - Feature description
  - Use cases
  - Benefits
  - Quick tutorial or demo
  - "Try It Now" button
**And** I can understand the feature before trying it
**And** I can start using the feature directly

**Given** I use a previously unused feature
**When** I use a feature for the first time
**Then** the system:
  - Marks feature as "used"
  - Removes feature from "unused" list
  - Shows success message: "Great! You've discovered [Feature Name]"
  - Updates feature discovery recommendations
**And** feature discovery adapts to my usage

**Given** I want to configure feature discovery
**When** I view feature discovery settings
**Then** I can:
  - Enable/disable feature discovery prompts
  - Set discovery frequency (always, weekly, never)
  - Dismiss specific features (don't show again)
  - Reset feature discovery (show all features as new)
**And** preferences are saved
**And** discovery respects my preferences

**Technical Notes:**
- Feature discovery: Tracks feature usage in `feature_usage` table
- Discovery algorithm: Identifies unused features, recommends based on persona/usage
- Discovery UI: Feature cards, contextual suggestions, feature badges
- Discovery storage: Feature usage and discovery preferences stored in user preferences
- Discovery personalization: Persona-specific and usage-based recommendations

---

### Story 12.7: Help Documentation and Support Resources

**Priority:** P1 (Post-MVP - UX polish, not blocking)

As a user,
I want to access help documentation and support resources,
So that I can learn how to use features and get help when needed.

**Acceptance Criteria:**

**Given** I need help
**When** I view Help menu or click "Help" icon
**Then** I can access:
  - **Help Center:** Searchable documentation
  - **Getting Started Guide:** Step-by-step tutorials
  - **Feature Guides:** Detailed guides for each feature
  - **Video Tutorials:** Video demos (if available)
  - **FAQ:** Frequently asked questions
  - **Contact Support:** Support contact options
**And** help is easily accessible
**And** help is available before and after payment

**Given** I want to search help documentation
**When** I use the help search
**Then** I can:
  - Enter search query
  - See search results (articles, guides, FAQs)
  - Filter results by category
  - Click results to view full content
**And** search is fast and accurate
**And** results are relevant

**Given** I want to view a feature guide
**When** I navigate to feature documentation
**Then** I see:
  - Feature overview
  - Step-by-step instructions
  - Screenshots or demos
  - Common use cases
  - Troubleshooting tips
  - Related articles
**And** documentation is comprehensive
**And** documentation is up-to-date

**Given** I want to contact support
**When** I click "Contact Support"
**Then** I can:
  - **Email Support:** Send email to support@infin8content.com
  - **Support Ticket:** Create support ticket (if ticketing system)
  - **Live Chat:** Start live chat (if available, based on plan)
  - **Response Time Info:** Expected response time based on plan
    - Starter: 48h response time
    - Pro: 24h response time
    - Agency: 4h response time
**And** support options are clear
**And** I can choose the best option for my needs

**Given** I want to see video tutorials
**When** I view tutorials
**Then** I can see:
  - Video library with tutorials
  - Video categories (Getting Started, Features, Advanced)
  - Video descriptions and durations
  - Play videos inline or in modal
**And** videos are helpful and well-produced
**And** I can follow along with tutorials

**Given** I want to access help from anywhere
**When** I use the platform
**Then** I can:
  - Click "?" icon for contextual help
  - Press F1 for help (if configured)
  - Access help from any page
  - See help links in tooltips
**And** help is always accessible
**And** contextual help is relevant to current page

**Given** help documentation is available
**When** I view help
**Then** documentation is:
  - Well-organized (categories, search, navigation)
  - Up-to-date (reflects current features)
  - Comprehensive (covers all features)
  - Easy to understand (clear language, examples)
  - Accessible (before and after payment)
**And** help improves user experience

**Technical Notes:**
- Help documentation: Markdown files, MDX, or CMS-managed content
- Help search: Full-text search across documentation
- Support contact: Email, ticketing system, or live chat integration
- Video tutorials: Embedded videos (YouTube, Vimeo, or hosted)
- Help accessibility: Available from any page, contextual help links

---

### Epic 13: Phase 2 Advanced Features (Post-Launch)
**User Outcome:** Users can access advanced content generation features, additional CMS integrations, and automation workflows.

**FRs covered:** FR121-FR129

**Key Capabilities:**
- Generate news articles from latest events
- Generate listicle articles with comparison tables
- Convert YouTube videos to blog posts
- Set up automated blog content generation
- Generate competitor comparison pages
- Edit existing articles with AI assistance
- Connect additional CMS platforms (Shopify, Webflow, Ghost, Wix, Squarespace, Blogger)
- Integrate with Zapier for no-code automation workflows
- Sync live product pricing and inventory from e-commerce stores

**Dependencies:** All Phase 1 epics (builds on complete platform)

**Success Metrics:**
- 30%+ adoption of Phase 2 features within 6 months of launch

### Story 13.1: News Article Generation from Latest Events

**Priority:** P1 (Post-MVP - Explicitly post-launch)

As a user,
I want to generate news articles from latest events,
So that I can create timely, relevant content about recent happenings in my niche.

**Acceptance Criteria:**

**Given** I want to create a news article
**When** I navigate to "Create Article" > "News Article"
**Then** I can configure news article generation:
  - **Topic:** Enter topic or niche (e.g., "artificial intelligence", "e-commerce trends")
  - **Country/Region:** Select country for news sources (optional, default: US)
  - **Time Range:** Select time range (last 24 hours, last 7 days, last 30 days)
  - **Article Focus:** Select focus (breaking news, analysis, roundup)
  - **Generate Article** button
**And** I can start news article generation

**Given** I configure and start news article generation
**When** generation begins
**Then** the system:
  - Searches Tavily for latest news: "latest [topic] news [time range]"
  - Retrieves top 10-20 news headlines from last 24 hours
  - Analyzes news sources and credibility
  - Identifies key events and stories
  - Generates news article structure:
    - **Headline:** News headline (timely, attention-grabbing)
    - **Lead Paragraph:** 5 Ws (Who, What, When, Where, Why)
    - **Body Sections:** 3-5 sections covering:
      - Main story details
      - Background context
      - Implications and analysis
      - Related developments
    - **Quote Boxes:** Key quotes from sources (if available)
    - **Related Stories:** Links to related news (if applicable)
    - **Last Updated:** Timestamp showing when article was generated
  - Includes NewsArticle schema markup (datePublished, dateModified, Author, Publisher)
**And** article is generated in < 5 minutes
**And** I see real-time progress updates

**Given** news article is generated
**When** I view the generated article
**Then** I can see:
  - News article with proper structure
  - Citations and sources for news items
  - Timestamps and dates
  - NewsArticle schema markup
  - "Last Updated" timestamp
**And** I can:
  - Edit the article (Epic 4B)
  - Add more sections
  - Update with newer information
  - Publish the article (Epic 5)
**And** article is ready for publishing

**Given** I want to set up automated news generation
**When** I configure "Autoblog" (Story 13.4)
**Then** I can:
  - Set up news article generation on schedule (hourly, daily, weekly)
  - Monitor specific topics for news
  - Auto-publish news articles (or save as drafts)
**And** news articles are generated automatically
**And** I can review before publishing

**Technical Notes:**
- News research: Tavily API for latest news search
- News structure: 5 Ws format, quote boxes, related stories
- Schema markup: NewsArticle structured data (datePublished, dateModified, Author, Publisher)
- Time sensitivity: News articles include timestamps and "last updated" dates
- Source credibility: Analyze and cite news sources

---

### Story 13.2: Listicle Article Generation with Comparison Tables

**Priority:** P1 (Post-MVP - Explicitly post-launch)

As a user,
I want to generate listicle articles with comparison tables,
So that I can create "Top 10" style articles with product comparisons.

**Acceptance Criteria:**

**Given** I want to create a listicle article
**When** I navigate to "Create Article" > "Listicle"
**Then** I can configure listicle generation:
  - **List Type:** "Top 10", "Best 7", "Ultimate 15", etc.
  - **Topic:** Enter topic (e.g., "best project management tools", "top running shoes")
  - **Items to Include:** Enter specific items to include (optional, or let AI research)
  - **Comparison Criteria:** Select criteria (price, features, pros/cons, ratings)
  - **Include Comparison Table:** Yes/No
  - **Include Pros/Cons:** Yes/No (from reviews)
  - **Include Pricing:** Yes/No (auto-updated from product websites)
  - **Editor's Choice:** Select top pick (optional)
  - **Your Product Promotion:** Include your product as #1 (optional, for agencies)
  - **Generate Article** button
**And** I can start listicle generation

**Given** I configure and start listicle generation
**When** generation begins
**Then** the system:
  - Researches items for the list (if not provided)
  - Gathers product information (features, pricing, reviews)
  - Scrapes pros/cons from reviews (Amazon, G2, Trustpilot) if enabled
  - Fetches pricing from product websites (if enabled)
  - Generates listicle structure:
    - **Introduction:** 200-word introduction explaining the list
    - **Quick Comparison Table:** Side-by-side comparison (if enabled)
    - **Item #1-N:** Each item with:
      - Item name and description
      - Features list
      - Pros and cons (if enabled)
      - Pricing (if enabled)
      - "Best for" statement
      - Rating or score
    - **Editor's Choice:** Highlighted top pick (if selected)
    - **Conclusion:** Summary and recommendations
    - **FAQ Section:** Frequently asked questions about the topic
  - Includes comparison table (if enabled)
  - Includes your product promotion (if configured)
**And** article is generated in < 5 minutes
**And** I see real-time progress updates

**Given** listicle article is generated
**When** I view the generated article
**Then** I can see:
  - Listicle with proper structure
  - Comparison table (if enabled)
  - Pros/cons for each item (if enabled)
  - Pricing information (if enabled)
  - Editor's choice highlighted
  - FAQ section
**And** I can:
  - Edit the article (Epic 4B)
  - Add/remove items
  - Update comparison table
  - Regenerate sections
  - Publish the article (Epic 5)
**And** article is ready for publishing

**Given** comparison table is included
**When** I view the comparison table
**Then** I can see:
  - Side-by-side comparison of items
  - Comparison criteria (price, features, ratings, etc.)
  - Visual table format
  - Sortable columns (if applicable)
**And** table is well-formatted
**And** table can be edited

**Given** pricing is auto-updated
**When** listicle includes pricing
**Then** pricing is:
  - Fetched from product websites
  - Updated automatically (nightly sync - Story 13.9)
  - Displayed in comparison table
  - Formatted consistently
**And** pricing stays current

**Technical Notes:**
- Listicle structure: Introduction, comparison table, items, conclusion, FAQ
- Review scraping: Amazon, G2, Trustpilot for pros/cons
- Pricing sync: Nightly price scraping from product websites (Story 13.9)
- Comparison table: HTML table format, sortable, responsive
- Product promotion: Optional injection of user's product as #1

---

### Story 13.3: YouTube Video to Blog Post Conversion

**Priority:** P1 (Post-MVP - Explicitly post-launch)

As a user,
I want to convert YouTube videos to blog posts,
So that I can repurpose video content into written articles.

**Acceptance Criteria:**

**Given** I want to convert a YouTube video
**When** I navigate to "Create Article" > "Convert YouTube Video"
**Then** I can:
  - Enter YouTube URL (paste video URL)
  - Or connect YouTube channel (auto-convert all new videos)
  - Select conversion options:
    - Include transcript (full transcript or summary)
    - Include timestamps (table of contents with timestamps)
    - Include embedded video (embed video in article)
    - Language (original or translate to other languages)
  - **Convert** button
**And** I can start conversion

**Given** I start YouTube conversion
**When** conversion begins
**Then** the system:
  - Extracts video metadata (title, description, channel, duration)
  - Retrieves transcript:
    - Uses YouTube auto-captions (if available)
    - Or uses Whisper API for transcription (if no captions)
  - Processes transcript:
    - Summarizes into key sections
    - Generates H2/H3 outline
    - Extracts timestamps
    - Identifies key quotes and takeaways
  - Generates article structure:
    - **Introduction:** Video overview and context
    - **Table of Contents:** Clickable timestamps linking to sections
    - **Embedded Video:** YouTube video embed (if enabled)
    - **Section Summaries:** Key sections from video with summaries
    - **Key Takeaways Box:** Highlighted main points
    - **Quotes:** Important quotes from video
    - **Conclusion:** Summary and call-to-action
    - **Transcript Accordion:** Full transcript (collapsible, if enabled)
  - Includes video schema markup (VideoObject)
**And** conversion completes in < 3 minutes
**And** I see real-time progress updates

**Given** YouTube video is converted
**When** I view the converted article
**Then** I can see:
  - Article with video content
  - Table of contents with timestamps
  - Embedded video (if enabled)
  - Section summaries
  - Key takeaways
  - Full transcript (if enabled)
**And** I can:
  - Edit the article (Epic 4B)
  - Add more sections
  - Improve summaries
  - Remove transcript (if too long)
  - Publish the article (Epic 5)
**And** article is ready for publishing

**Given** I want multilingual conversion
**When** I select translation option
**Then** the system:
  - Translates transcript to selected language
  - Generates article in translated language
  - Maintains article structure
  - Preserves timestamps and video embed
**And** I can publish same video as multiple language articles
**And** translation is accurate

**Given** I connect YouTube channel
**When** I enable auto-conversion
**Then** the system:
  - Monitors connected YouTube channel for new videos
  - Automatically converts new videos to blog posts
  - Saves as drafts (or publishes, if configured)
  - Notifies me when conversion completes
**And** auto-conversion works seamlessly
**And** I can review before publishing

**Technical Notes:**
- YouTube API: Extract video metadata and captions
- Transcription: YouTube auto-captions or Whisper API
- Article structure: Introduction, TOC with timestamps, sections, takeaways, transcript
- Video embed: YouTube iframe embed
- Multilingual: Translation API for multiple language support
- Auto-conversion: Monitor YouTube channel for new videos

---

### Story 13.4: Automated Blog Content Generation (Autoblog)

**Priority:** P1 (Post-MVP - Explicitly post-launch)

As a user,
I want to set up automated blog content generation,
So that articles are created and published automatically on a schedule.

**Acceptance Criteria:**

**Given** I want to set up automated content generation
**When** I navigate to Settings > Autoblog
**Then** I can configure autoblog:
  - **Content Sources:**
    - Keyword list (upload 100 keywords, write 1 article per keyword)
    - RSS feed (monitor competitor blogs, auto-write similar articles)
    - YouTube channel (monitor for new videos, auto-convert to blog post)
    - Google News topics (track trending stories, write news articles)
    - Trending keywords (monitor Google Trends, write when keyword goes viral)
  - **Publishing Rules:**
    - Frequency: Hourly, daily (choose time), weekly (choose day)
    - Quantity: 1-20 articles per cycle
    - Status: Publish live immediately OR save as draft for review
  - **Auto-Enhancements:**
    - Generate featured image
    - Add internal links
    - Generate FAQ section
    - Add schema markup
    - Generate meta tags
    - Create social posts
    - Submit to Google Search Console for indexing
  - **Save Configuration** button
**And** I can set up autoblog

**Given** I configure autoblog with keyword list
**When** autoblog runs
**Then** the system:
  - Processes keywords from the list
  - Generates articles for each keyword (Epic 4A)
  - Applies auto-enhancements (featured image, FAQ, schema, etc.)
  - Publishes articles (or saves as drafts) based on configuration
  - Tracks generation progress
  - Notifies me when articles are published
**And** articles are generated automatically
**And** I can review published articles

**Given** I configure autoblog with RSS feed
**When** autoblog runs
**Then** the system:
  - Monitors RSS feed for new posts
  - Detects new competitor articles
  - Generates similar articles (different angle, same topic)
  - Applies auto-enhancements
  - Publishes articles (or saves as drafts)
  - Tracks RSS monitoring
**And** competitor content is automatically responded to
**And** I can review generated articles

**Given** I configure autoblog with Google News
**When** autoblog runs
**Then** the system:
  - Monitors Google News for trending stories in configured topics
  - Detects trending news
  - Generates news articles (Story 13.1)
  - Publishes articles within 30 minutes of trending
  - Tracks news monitoring
**And** timely news articles are published automatically
**And** I can review published articles

**Given** I want to manage autoblog
**When** I view Autoblog settings
**Then** I can:
  - View autoblog status (Active, Paused, Stopped)
  - See generation history (articles generated, published, failed)
  - Pause/Resume autoblog
  - Edit configuration
  - Delete autoblog setup
**And** autoblog is manageable
**And** I have full control

**Given** autoblog generates articles
**When** articles are published
**Then** I receive notifications:
  - "Autoblog: 5 articles published today"
  - List of published articles
  - Links to view articles
**And** I can review published articles
**And** I can edit or unpublish if needed

**Technical Notes:**
- Autoblog scheduling: Inngest cron jobs for scheduled generation
- Content sources: Keyword list, RSS feeds, YouTube channels, Google News, Google Trends
- Auto-enhancements: Featured images, internal links, FAQ, schema, meta tags, social posts
- Publishing rules: Frequency, quantity, status (publish or draft)
- Monitoring: Track autoblog performance and generation history

---

### Story 13.5: Competitor Comparison Page Generation

**Priority:** P1 (Post-MVP - Explicitly post-launch)

As a user,
I want to generate competitor comparison pages,
So that I can create "X vs Y" and "Alternatives to X" pages for SEO.

**Acceptance Criteria:**

**Given** I want to create a competitor comparison page
**When** I navigate to "Create Article" > "Comparison Page"
**Then** I can configure comparison page:
  - **Page Type:** "X vs Y", "Alternatives to X", "What is X"
  - **Your Product:** Enter your product name
  - **Competitors:** Enter competitor names (or let AI research)
  - **Comparison Criteria:** Select criteria (features, pricing, pros/cons, use cases)
  - **Include Dynamic Pricing:** Yes/No (auto-updated pricing tables)
  - **Include CTA:** Yes/No (call-to-action for your product)
  - **Generate Page** button
**And** I can start comparison page generation

**Given** I configure and start comparison page generation
**When** generation begins
**Then** the system:
  - Researches competitors (if not provided)
  - Gathers product information (features, pricing, reviews)
  - Fetches pricing from product websites (if enabled)
  - Generates comparison page structure:
    - **Introduction:** Overview of comparison
    - **Quick Comparison Table:** Side-by-side feature comparison
    - **Detailed Sections:**
      - Product overviews
      - Feature comparisons
      - Pricing comparisons (with dynamic pricing if enabled)
      - Pros/cons for each product
      - Use case recommendations
      - "Best for" statements
    - **Verdict/Conclusion:** Summary and recommendation
    - **CTA Section:** Call-to-action for your product (if enabled)
    - **FAQ Section:** Frequently asked questions
  - Includes comparison schema markup
**And** page is generated in < 5 minutes
**And** I see real-time progress updates

**Given** comparison page is generated
**When** I view the generated page
**Then** I can see:
  - Comparison page with proper structure
  - Comparison table
  - Detailed sections for each product
  - Pricing information (if enabled)
  - CTA section (if enabled)
  - FAQ section
**And** I can:
  - Edit the page (Epic 4B)
  - Update comparison criteria
  - Add/remove competitors
  - Update pricing (or let it auto-update)
  - Publish the page (Epic 5)
**And** page is ready for publishing

**Given** dynamic pricing is enabled
**When** comparison page includes pricing
**Then** pricing is:
  - Fetched from product websites
  - Updated automatically (nightly sync - Story 13.9)
  - Displayed in comparison table
  - Formatted consistently
**And** pricing stays current
**And** comparison table updates automatically

**Given** I want to generate bulk comparison pages
**When** I use bulk generation
**Then** I can:
  - Upload list of products
  - Generate multiple comparison pages (X vs Y, Alternatives, What is X)
  - Bulk generate pages for all combinations
  - Review and publish in bulk
**And** bulk generation saves time
**And** I can manage multiple comparison pages

**Technical Notes:**
- Comparison page structure: Introduction, comparison table, detailed sections, verdict, CTA, FAQ
- Dynamic pricing: Nightly price scraping and auto-updates (Story 13.9)
- Comparison schema: Structured data for comparison pages
- Bulk generation: Generate multiple comparison pages from product list
- CTA injection: Optional call-to-action for user's product

---

### Story 13.6: AI-Powered Article Editing Assistant

**Priority:** P1 (Post-MVP - Explicitly post-launch)

As a user,
I want to edit existing articles with AI assistance,
So that I can improve content quality, update information, and enhance SEO.

**Acceptance Criteria:**

**Given** I want to edit an existing article
**When** I open an article in the editor
**Then** I can access AI editing features:
  - **Quick Fixes:**
    - Fix grammar/spelling
    - Improve readability
    - Add transition words
    - Make concise
  - **Content Operations:**
    - Add section about topic
    - Expand paragraph
    - Shorten section
    - Rewrite in different tone
  - **SEO Enhancements:**
    - Sprinkle keywords
    - Add FAQ section
    - Insert internal links
    - Generate meta tags
  - **Fact Updates:**
    - Update statistics with current data
    - Add citations to claims
    - Check for outdated info
  - **Visual Enhancements:**
    - Generate featured image
    - Add inline images
    - Create comparison tables
    - Find YouTube videos
**And** editing features are accessible via:
  - Chat interface (split-screen: article on left, chat on right)
  - Right-click menu (highlight text → "Rewrite this" / "Expand" / "Delete")
  - Toolbar buttons
**And** I can use AI to edit articles

**Given** I want to use chat-based editing
**When** I open chat interface
**Then** I can:
  - Type natural language requests: "Add a section about X", "Make this more concise", "Add keywords about Y"
  - See AI suggestions and edits
  - Accept or reject edits
  - Refine edits with follow-up requests
**And** chat interface is intuitive
**And** edits are applied to article

**Given** I want to use right-click editing
**When** I highlight text and right-click
**Then** I see context menu:
  - "Rewrite this" (improve wording)
  - "Expand" (add more detail)
  - "Shorten" (make more concise)
  - "Add keywords" (optimize for SEO)
  - "Add citation" (add source)
  - "Delete" (remove section)
**And** I can select an action
**And** edit is applied immediately

**Given** I make edits
**When** edits are applied
**Then** the system:
  - Shows before/after comparison
  - Saves revision history (unlimited versions)
  - Tracks who made the edit and when
  - Allows undo/redo
**And** I can:
  - Compare versions side-by-side
  - Restore previous versions
  - See edit history
**And** revision history is maintained

**Given** I want to update article with current data
**When** I use "Update Statistics" or "Check for Outdated Info"
**Then** the system:
  - Identifies statistics and claims in article
  - Researches current data (Tavily API)
  - Updates statistics with latest data
  - Adds citations for updated data
  - Highlights what was updated
**And** article stays current
**And** updates are clearly marked

**Given** I want to enhance SEO
**When** I use SEO enhancement features
**Then** the system:
  - Analyzes article for SEO opportunities
  - Suggests keyword optimizations
  - Adds FAQ section (if missing)
  - Suggests internal links
  - Generates/updates meta tags
  - Improves heading structure
**And** SEO improvements are applied
**And** article SEO score improves

**Technical Notes:**
- AI editing: LLM-powered editing (OpenRouter) with article context
- Chat interface: Split-screen with article and chat
- Right-click menu: Context menu for quick edits
- Revision history: Track all edits with before/after comparisons
- SEO enhancements: Keyword optimization, FAQ generation, internal linking, meta tags

---

### Story 13.7: Additional CMS Platform Integrations

**Priority:** P1 (Post-MVP - Explicitly post-launch)

As a user,
I want to connect additional CMS platforms beyond WordPress,
So that I can publish to Shopify, Webflow, Ghost, Wix, Squarespace, and Blogger.

**Acceptance Criteria:**

**Given** I want to connect an additional CMS
**When** I navigate to Settings > Integrations > CMS Connections
**Then** I can see supported CMS platforms:
  - WordPress (already supported in Phase 1)
  - Shopify
  - Webflow
  - Ghost
  - Wix
  - Squarespace
  - Blogger
  - Custom Webhook
**And** I can click "Connect" for any platform

**Given** I want to connect Shopify
**When** I click "Connect" for Shopify
**Then** I can connect via:
  - Shopify Blog (if Shopify store has blog)
  - Shopify Pages (for static pages)
  - OAuth flow (Shopify Admin API)
**And** connection process is similar to WordPress (Story 5.1)
**And** I can publish articles to Shopify blog

**Given** I want to connect Webflow
**When** I click "Connect" for Webflow
**Then** I can:
  - Enter Webflow API token
  - Select Webflow site
  - Test connection
  - Save connection
**And** connection uses Webflow CMS API
**And** I can publish articles to Webflow CMS

**Given** I want to connect Ghost
**When** I click "Connect" for Ghost
**Then** I can:
  - Enter Ghost Admin API key
  - Enter Ghost site URL
  - Test connection
  - Save connection
**And** connection uses Ghost Admin API
**And** I can publish articles to Ghost

**Given** I want to connect Wix
**When** I click "Connect" for Wix
**Then** I am redirected to Wix OAuth flow:
  - Wix authorization page
  - I authorize the app
  - I am redirected back to Infin8Content
  - Connection is established
**And** OAuth flow completes
**And** I can publish articles to Wix

**Given** I want to connect Squarespace
**When** I click "Connect" for Squarespace
**Then** I can:
  - Enter Squarespace API key
  - Enter Squarespace site URL
  - Test connection
  - Save connection
**And** connection uses Squarespace API
**And** I can publish articles to Squarespace

**Given** I want to connect Blogger
**When** I click "Connect" for Blogger
**Then** I am redirected to Google OAuth flow:
  - Google authorization (Blogger is part of Google ecosystem)
  - I authorize Blogger access
  - I am redirected back to Infin8Content
  - Connection is established
**And** OAuth flow completes
**And** I can publish articles to Blogger

**Given** I have connected multiple CMS platforms
**When** I publish an article
**Then** I can:
  - Select which CMS to publish to (or multiple)
  - Publish to all connected CMS platforms
  - See publishing status for each CMS
**And** multi-CMS publishing works seamlessly
**And** I can manage all CMS connections

**Technical Notes:**
- CMS integrations: Platform-specific adapters (ShopifyAdapter, WebflowAdapter, etc.)
- Authentication: OAuth for Shopify/Wix/Blogger, API keys for Webflow/Ghost/Squarespace
- Publishing: Unified publishing interface (normalize differences between platforms)
- Connection storage: CMS connections saved to `cms_connections` table
- Multi-CMS publishing: Publish to multiple CMS platforms simultaneously

---

### Story 13.8: Zapier Integration for No-Code Automation

**Priority:** P1 (Post-MVP - Explicitly post-launch)

As a user,
I want to integrate with Zapier for no-code automation workflows,
So that I can connect Infin8Content with other tools and automate workflows.

**Acceptance Criteria:**

**Given** I want to set up Zapier integration
**When** I navigate to Settings > Integrations > Zapier
**Then** I can:
  - View Zapier integration status
  - See available Zapier triggers and actions
  - Connect Zapier account
  - Configure Zapier workflows
**And** Zapier integration is accessible

**Given** I want to connect Zapier
**When** I click "Connect Zapier"
**Then** I am redirected to Zapier:
  - Zapier authorization page
  - I authorize Infin8Content app
  - I am redirected back to Infin8Content
  - Connection is established
**And** OAuth flow completes
**And** Zapier integration is active

**Given** Zapier integration is active
**When** I configure Zapier workflows
**Then** I can set up Zaps (automation workflows):
  - **Triggers (Infin8Content → Other Apps):**
    - New article generated
    - Article published
    - Keyword research completed
    - Revenue attributed
    - Usage limit reached
  - **Actions (Other Apps → Infin8Content):**
    - Generate article from trigger
    - Publish article from trigger
    - Create keyword research from trigger
    - Update article from trigger
**And** Zaps are configured in Zapier interface
**And** workflows run automatically

**Given** I set up a Zap
**When** Zap trigger occurs
**Then** the system:
  - Sends webhook to Zapier with event data
  - Zapier processes the trigger
  - Connected app receives data
  - Action is performed in connected app
**And** automation works seamlessly
**And** I receive notifications (if configured)

**Given** I want to see Zapier activity
**When** I view Zapier integration
**Then** I can see:
  - Active Zaps
  - Zap execution history
  - Success/failure rates
  - Recent activity
**And** I can monitor Zapier workflows
**And** I can troubleshoot failed Zaps

**Given** I want to disconnect Zapier
**When** I click "Disconnect Zapier"
**Then** I see confirmation: "Are you sure you want to disconnect Zapier? This will stop all active Zaps."
**And** if I confirm:
  - Zapier connection is removed
  - All Zaps are deactivated
  - I receive confirmation
**And** I can reconnect later if needed

**Technical Notes:**
- Zapier integration: OAuth connection to Zapier
- Webhooks: Send events to Zapier (triggers) and receive from Zapier (actions)
- Zap configuration: Done in Zapier interface, not in Infin8Content
- Event data: JSON payloads with article data, event type, timestamps
- Activity tracking: Log Zapier webhook deliveries and executions

---

### Story 13.9: Live Product Pricing and Inventory Sync

**Priority:** P1 (Post-MVP - Explicitly post-launch)

As a user,
I want to sync live product pricing and inventory from e-commerce stores,
So that comparison tables and product descriptions stay current.

**Acceptance Criteria:**

**Given** I have connected e-commerce stores (Epic 7)
**When** I view product catalog
**Then** I can see:
  - Product pricing (current price)
  - Inventory status (in stock, out of stock, quantity)
  - Last synced timestamp
  - Sync status (synced, pending, error)
**And** product data is displayed

**Given** I want to enable live pricing sync
**When** I configure store settings
**Then** I can:
  - Enable/disable live pricing sync
  - Set sync frequency (hourly, daily, real-time)
  - Set sync scope (all products, specific products)
  - Configure sync schedule
**And** live pricing sync is configurable

**Given** live pricing sync is enabled
**When** sync runs
**Then** the system:
  - Fetches current pricing from store API (Shopify/WooCommerce)
  - Fetches inventory status
  - Updates product records in database
  - Updates comparison tables in articles (if products are used)
  - Logs sync activity
**And** pricing and inventory stay current
**And** sync happens automatically

**Given** pricing changes in the store
**When** sync detects price change
**Then** the system:
  - Updates product price in database
  - Updates comparison tables in published articles (if enabled)
  - Notifies me of significant price changes (if configured)
  - Logs price change history
**And** articles stay current with live pricing
**And** price changes are tracked

**Given** inventory changes in the store
**When** sync detects inventory change
**Then** the system:
  - Updates inventory status in database
  - Updates product availability in articles (if displayed)
  - Notifies me of out-of-stock items (if configured)
  - Logs inventory change history
**And** inventory status stays current
**And** inventory changes are tracked

**Given** I want to see sync history
**When** I view product sync history
**Then** I can see:
  - Sync timestamps
  - Products synced
  - Price changes detected
  - Inventory changes detected
  - Sync errors (if any)
**And** sync history is complete
**And** I can troubleshoot sync issues

**Given** sync fails
**When** sync encounters an error
**Then** the system:
  - Logs error details
  - Retries sync (3 attempts with exponential backoff)
  - Notifies me if sync fails permanently
  - Preserves previous pricing/inventory data
**And** sync failures are handled gracefully
**And** I can manually retry sync

**Technical Notes:**
- Pricing sync: Fetch from Shopify/WooCommerce API (product prices, compare-at prices)
- Inventory sync: Fetch inventory status and quantities
- Sync frequency: Configurable (hourly, daily, real-time via webhooks)
- Comparison table updates: Auto-update comparison tables in articles with new pricing
- Sync storage: Product pricing and inventory stored in `products` table, sync history in `product_sync_history` table

---

## Epic 14: SEO Optimization Framework (MVP BLOCKER)

**User Outcome:** Content creators can generate SEO-optimized articles that rank higher, capture featured snippets, and drive more organic traffic and revenue.

**Business Impact:** This is a core differentiator that enables the platform to deliver on its promise of "end-to-end SEO content automation." Without this framework, generated content will not rank effectively, making the product non-viable for market success.

**FRs covered:** SEO-specific requirements derived from core value proposition

**MVP Status:** CRITICAL BLOCKER - Must be completed before MVP shipment

### Story 14.1: Enhanced System Prompt with E-E-A-T Principles
**Priority**: MVP Critical  
**Story Points**: 8  
**User Story**: As a content creator, I want the AI to generate content that demonstrates expertise, experience, authority, and trustworthiness, so that my content ranks higher and builds credibility with readers.

**Acceptance Criteria:**
- [ ] System prompt includes comprehensive E-E-A-T principles and guidelines
- [ ] SEO rules integrated (keyword placement, paragraph structure, citation distribution)
- [ ] Forbidden practices clearly defined and prevented (keyword stuffing, generic fluff)
- [ ] Content quality standards enforced (readability, depth, authority signals)
- [ ] Featured snippet optimization instructions included
- [ ] Citation integrity requirements enforced throughout content

**Technical Requirements:**
- Update `lib/services/article-generation/system-prompt.ts`
- Integrate E-E-A-T validation framework
- Add SEO rule engine for content generation
- Implement forbidden practices detection and prevention

**Dependencies:** Epic 4 (Article Generation Pipeline)

### Story 14.2: Enhanced User Prompt with SEO Strategy
**Priority**: MVP Critical  
**Story Points**: 8  
**User Story**: As a content creator, I want to specify SEO strategy parameters including keyword density, semantic variations, and formatted research sources, so that I can control the SEO optimization level for each article.

**Acceptance Criteria:**
- [ ] SEO strategy section added to user prompt template
- [ ] Keyword density calculator and recommendations (0.5-1.5% target)
- [ ] Semantic keyword suggestions and integration throughout content
- [ ] Formatted research sources with proper citation requirements
- [ ] Quality checklist integration for user validation
- [ ] Section-specific templates for different content types and audiences

**Technical Requirements:**
- Update `lib/services/article-generation/user-prompt.ts`
- Create SEO strategy calculation functions
- Build semantic keyword generation system
- Implement research source formatting engine

**Dependencies:** Story 14.1 (Enhanced System Prompt)

### Story 14.3: Section Templates System
**Priority**: MVP Critical  
**Story Points**: 10  
**User Story**: As a content creator, I want access to optimized templates for different article sections (intro, H2, H3, conclusion, FAQ), so that I can ensure consistent SEO-optimized structure across all content.

**Acceptance Criteria:**
- [ ] Create `section-templates.ts` with comprehensive template library
- [ ] Introduction templates (80-150 words with keyword in first 100)
- [ ] H2 section templates with featured snippet optimization boxes
- [ ] H3 subsection templates with focused content guidelines
- [ ] Conclusion templates with action-oriented formatting
- [ ] FAQ templates with schema markup optimization
- [ ] Template selection based on content type and target audience

**Technical Requirements:**
- New file: `lib/services/article-generation/section-templates.ts`
- Template engine with dynamic content insertion
- SEO validation for each template type
- Template performance tracking and optimization

**Dependencies:** Story 14.2 (Enhanced User Prompt)

### Story 14.4: SEO Helper Functions
**Priority**: MVP Critical  
**Story Points**: 8  
**User Story**: As a content creator, I want automated SEO helper functions for keyword analysis, semantic optimization, and source formatting, so that I can ensure maximum SEO effectiveness without manual effort.

**Acceptance Criteria:**
- [ ] Create `seo-helpers.ts` with comprehensive SEO utility functions
- [ ] Keyword density analysis and optimization recommendations
- [ ] Semantic keyword generation and integration throughout content
- [ ] Source formatting with proper citation distribution (1 per 200 words)
- [ ] Context optimization for search intent matching
- [ ] SEO score calculation and improvement suggestions

**Technical Requirements:**
- New file: `lib/services/article-generation/seo-helpers.ts`
- Keyword density calculation algorithms
- Semantic keyword analysis using NLP techniques
- Citation distribution optimization engine
- SEO scoring and recommendation system

**Dependencies:** Story 14.3 (Section Templates)

### Story 14.5: Format Changes and Content Structure
**Priority**: MVP Critical  
**Story Points**: 6  
**User Story**: As a content creator, I want content that follows SEO-optimized formatting rules (paragraph length, heading structure, citation distribution), so that my content is both readable and search-engine friendly.

**Acceptance Criteria:**
- [ ] Paragraph formatting: 2-4 sentences maximum for readability
- [ ] H1 optimization: 55-65 characters with benefit-driven structure
- [ ] Introduction optimization: 80-150 words with keyword in first 100
- [ ] Citation distribution: 1 per 200 words, evenly distributed (not clustered)
- [ ] Heading hierarchy: Proper H2/H3 structure without skipped levels
- [ ] Featured snippet boxes integrated throughout content

**Technical Requirements:**
- Update content generation pipeline with formatting rules
- Implement paragraph length validation and optimization
- Add heading structure analysis and correction
- Build citation distribution algorithm
- Create featured snippet formatting engine

**Dependencies:** Story 14.4 (SEO Helper Functions)

### Story 14.6: SEO Testing and Validation
**Priority**: MVP Critical  
**Story Points**: 8  
**User Story**: As a product owner, I want comprehensive testing of SEO optimization features, so that I can verify the system produces high-ranking, SEO-optimized content consistently.

**Acceptance Criteria:**
- [ ] Generate test articles and verify intro length compliance (80-150 words)
- [ ] Validate paragraph density and structure optimization (2-4 sentences)
- [ ] Test keyword placement and density accuracy (0.5-1.5% target)
- [ ] Verify featured snippet box integration and formatting
- [ ] Test citation distribution and formatting (1 per 200 words)
- [ ] Validate SEO score improvements vs. baseline content
- [ ] Performance testing for SEO optimization processing impact

**Technical Requirements:**
- Create comprehensive SEO test suite
- Build content validation framework
- Implement SEO performance benchmarking
- Add automated SEO quality checks
- Create regression tests for SEO features

**Dependencies:** Story 14.5 (Format Changes)

**Integration Points:**
- **Enhances Epic 4**: Article Generation Pipeline with SEO optimization
- **Improves Epic 7**: Revenue Attribution through better search rankings
- **Supports Epic 12**: Content Publishing with SEO-optimized output formatting

**Risk Mitigation:**
- **Performance Impact**: SEO processing may slow content generation - implement caching
- **Complexity**: Multiple SEO rules may conflict - create modular rule system
- **Maintenance**: SEO rules require updates - design configurable system

**Success Metrics:**
- **SEO Score Improvement**: 40%+ improvement in content SEO scores
- **User Adoption**: 80%+ of users enable SEO optimization features
- **Content Performance**: 25%+ improvement in average content rankings
- **Featured Snippets**: 30%+ of optimized content captures featured snippets

**Timeline:**
- **Week 1**: Stories 14.1, 14.2 (System and User Prompts)
- **Week 2**: Stories 14.3, 14.4 (Templates and Helpers)
- **Week 3**: Stories 14.5, 14.6 (Format Changes and Testing)

**MVP BLOCKER STATUS**: This epic must be completed before MVP shipment. All stories are marked as MVP critical and should be prioritized above all other features.

