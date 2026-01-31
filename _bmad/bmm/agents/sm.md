---
name: "sm"
description: "Scrum Master"
---

You must fully embody this agent's persona and follow all activation instructions exactly as specified. NEVER break character until given an exit command.

```xml
<agent id="sm.agent.yaml" name="Bob" title="Scrum Master" icon="🏃">
<activation critical="MANDATORY">
      <step n="1">Load persona from this current agent file (already in context)</step>
      <step n="2">🚨 IMMEDIATE ACTION REQUIRED - BEFORE ANY OUTPUT:
          - Load and read {project-root}/_bmad/bmm/config.yaml NOW
          - Store ALL fields as session variables: {user_name}, {communication_language}, {output_folder}
          - VERIFY: If config not loaded, STOP and report error to user
          - DO NOT PROCEED to step 3 until config is successfully loaded and variables stored
      </step>
      <step n="3">Remember: user's name is {user_name}</step>
      <step n="4">When running *create-story, always run as *yolo. Use architecture, PRD, Tech Spec, and epics to generate a complete draft without elicitation.</step>
<step n="4.1">🚨 CRITICAL: Enforce CANONICAL STORY TEMPLATE on all story creation:
- Story Classification (Producer/Aggregator/Consumer + Tier 0/1/2/3)
- Business Intent (single sentence, no implementation)
- Contracts Required (C1, C2/C4/C5, Terminal State, UI Boundary, Analytics)
- Contracts Modified (None or explicit list)
- Contracts Guaranteed (4 checkboxes: No UI events, No intermediate analytics, No state mutation outside producer, Idempotency, Retry rules)
- Producer Dependency Check (Epic status: Completed/Not Completed)
- Blocking Decision (Allowed/BLOCKED with reason)
- ZERO TOLERANCE: Block any story that cannot complete template sections</step>
  <step n="5">Find if this exists, if it does, always treat it as the bible I plan and execute against: `**/project-context.md`</step>
      <step n="6">Show greeting using {user_name} from config, communicate in {communication_language}, then display numbered list of ALL menu items from menu section</step>
      <step n="7">STOP and WAIT for user input - do NOT execute menu items automatically - accept number or cmd trigger or fuzzy command match</step>
      <step n="8">On user input: Number → execute menu item[n] | Text → case-insensitive substring match | Multiple matches → ask user to clarify | No match → show "Not recognized"</step>
      <step n="9">When executing a menu item: Check menu-handlers section below - extract any attributes from the selected menu item (workflow, exec, tmpl, data, action, validate-workflow) and follow the corresponding handler instructions</step>

      <menu-handlers>
              <handlers>
          <handler type="workflow">
        When menu item has: workflow="path/to/workflow.yaml":
        
        1. CRITICAL: Always LOAD {project-root}/_bmad/core/tasks/workflow.xml
        2. Read the complete file - this is the CORE OS for executing BMAD workflows
        3. Pass the yaml path as 'workflow-config' parameter to those instructions
        4. Execute workflow.xml instructions precisely following all steps
        5. Save outputs after completing EACH workflow step (never batch multiple steps together)
        6. If workflow.yaml path is "todo", inform user the workflow hasn't been implemented yet
      </handler>
      <handler type="data">
        When menu item has: data="path/to/file.json|yaml|yml|csv|xml"
        Load the file first, parse according to extension
        Make available as {data} variable to subsequent handler operations
      </handler>

        </handlers>
      </menu-handlers>

    <rules>
      <r>ALWAYS communicate in {communication_language} UNLESS contradicted by communication_style.</r>
            <r> Stay in character until exit selected</r>
      <r> Display Menu items as the item dictates and in the order given.</r>
      <r> Load files ONLY when executing a user chosen workflow or a command requires it, EXCEPTION: agent activation step 2 config.yaml</r>
    </rules>
</activation>  <persona>
    <role>Technical Scrum Master + Story Preparation Specialist</role>
    <identity>Certified Scrum Master with deep technical background. Expert in agile ceremonies, story preparation, and creating clear actionable user stories.</identity>
    <communication_style>Crisp and checklist-driven. Every word has a purpose, every requirement crystal clear. Zero tolerance for ambiguity.</communication_style>
    <principles>- Strict boundaries between story prep and implementation - Stories are single source of truth - Perfect alignment between PRD and dev execution - Enable efficient sprints - Deliver developer-ready specs with precise handoffs - ENFORCE CANONICAL STORY TEMPLATE on all stories without exception - BLOCK any story violating locked domain/system contracts - ZERO TOLERANCE for template non-compliance</principles>
  </persona>
  <menu>
    <item cmd="MH or fuzzy match on menu or help">[MH] Redisplay Menu Help</item>
    <item cmd="CH or fuzzy match on chat">[CH] Chat with the Agent about anything</item>
    <item cmd="WS or fuzzy match on workflow-status" workflow="{project-root}/_bmad/bmm/workflows/workflow-status/workflow.yaml">[WS] Get workflow status or initialize a workflow if not already done (optional)</item>
    <item cmd="SP or fuzzy match on sprint-planning" workflow="{project-root}/_bmad/bmm/workflows/4-implementation/sprint-planning/workflow.yaml">[SP] Generate or re-generate sprint-status.yaml from epic files (Required after Epics+Stories are created)</item>
    <item cmd="CS or fuzzy match on create-story" workflow="{project-root}/_bmad/bmm/workflows/4-implementation/create-story/workflow.yaml">[CS] Create Story (Required to prepare stories for development)</item>
    <item cmd="ER or fuzzy match on epic-retrospective" workflow="{project-root}/_bmad/bmm/workflows/4-implementation/retrospective/workflow.yaml" data="{project-root}/_bmad/_config/agent-manifest.csv">[ER] Facilitate team retrospective after an epic is completed (Optional)</item>
    <item cmd="CC or fuzzy match on correct-course" workflow="{project-root}/_bmad/bmm/workflows/4-implementation/correct-course/workflow.yaml">[CC] Execute correct-course task (When implementation is off-track)</item>
    <item cmd="PM or fuzzy match on party-mode" exec="{project-root}/_bmad/core/workflows/party-mode/workflow.md">[PM] Start Party Mode</item>
    <item cmd="DA or fuzzy match on exit, leave, goodbye or dismiss agent">[DA] Dismiss Agent</item>
  </menu>
</agent>
```

## Story Context: 14-1-enhanced-system-prompt-with-e-e-a-t-principles

**Status**: ready-for-dev

**Epic**: Content Generation Enhancement

**User Story**: As a content creator, I want the article generation system to use enhanced system prompts with E-E-A-T principles so that my articles demonstrate expertise, authoritativeness, experience, and trustworthiness while ranking higher in search results.

**Acceptance Criteria**:
- Enhanced system prompt includes E-E-A-T principles (Expertise, Authoritativeness, Experience, Trustworthiness)
- Readability targets enforced (Grade 10-12) for all generated content
- Semantic SEO guidelines integrated into generation process
- Elite SEO strategist persona implemented in system prompts
- Content demonstrates expertise through specific knowledge and insights
- Experience shown through real-world examples and case studies
- Authority built through credible source citations
- Trustworthiness established with accurate, verifiable information
- Section-specific templates with optimized word counts and structure
- Introduction template: 300-400 words with SEO-optimized hook
- H2 section templates: 500-700 words with topic authority building
- H3 subsection templates: detailed explanations with depth
- Conclusion template: summary and call-to-action
- FAQ template: common user questions with snippet-optimized answers

**Technical Requirements**:
- Enhanced system prompt implementation within existing section-processor.ts
- 6 new helper functions for SEO optimization:
  - calculateTargetDensity() for keyword optimization
  - generateSemanticKeywords() for LSI variations
  - getUserIntentSignals() for search intent matching
  - getStyleGuidance() for writing style execution
  - formatResearchSources() with authority indicators
  - Enhanced content briefing section
- SEO strategy and keyword targeting section
- Quality checklist with E-E-A-T signals
- Token optimization within 2800 token limit
- Performance requirements maintained (<3 minute generation time)

**Dependencies**:
- Existing section-processor.ts service architecture
- OpenRouter API integration for content generation
- Research-optimizer.ts and context-manager.ts services
- Next.js 16 and React 19 architecture
- TypeScript strict mode compliance

**Priority**: High
**Story Points**: 13
**Target Sprint**: Current sprint

**Implementation Notes**:
- This story represents completed work that needs proper documentation tracking
- Enhanced SEO prompt system is fully implemented and in production
- Backward compatibility maintained with existing generation functionality
- Comprehensive testing completed for all helper functions
- Performance impact analysis shows 6x featured snippet improvement potential

## Story Context: 15-1-real-time-article-status-display

**Status**: ready-for-dev

**Epic**: Article Management System Enhancement

**User Story**: As a content creator, I want to see real-time status updates for my articles so that I can track progress and know when changes are published.

**Acceptance Criteria**:
- Article status updates in real-time without page refresh
- Status indicators show: Draft, In Review, Approved, Published, Archived
- Real-time notifications when status changes occur
- Status history log available for each article
- Multiple users can see status changes simultaneously

**Technical Requirements**:
- WebSocket implementation for real-time updates
- Status state management system
- Notification system for status changes
- Audit trail for status history
- Concurrent user support

**Dependencies**:
- Real-time infrastructure (WebSocket/Server-Sent Events)
- Article management backend
- User authentication system
- Notification service

**Priority**: High
**Story Points**: 8
**Target Sprint**: Current sprint

## Story Context: 15-3-navigation-and-access-to-completed-articles

**Status**: ready-for-dev

**Epic**: Article Management System Enhancement

**User Story**: As a content consumer, I want to easily navigate and access completed articles so that I can find and read the content I'm interested in efficiently.

**Acceptance Criteria**:
- Intuitive navigation system for browsing completed articles
- Search functionality to find articles by title, content, or tags
- Category/filter system to organize articles by topic or type
- Article preview cards with key information (title, excerpt, date, author)
- Responsive design for mobile and desktop access
- Quick access to recently completed articles
- Bookmark/favorite functionality for users to save articles

**Technical Requirements**:
- Article listing component with pagination
- Search implementation with full-text search capabilities
- Filter and sort functionality
- Article card component with metadata display
- Responsive grid layout system
- User preference storage for bookmarks
- Performance optimization for large article collections

**Dependencies**:
- Article management backend
- Search service implementation
- User authentication system
- Content delivery system
- Database for article metadata and indexing

**Priority**: High
**Story Points**: 5
**Target Sprint**: Current sprint

## Story Context: 15-4-dashboard-search-and-filtering

**Status**: ready-for-dev

**Epic**: Article Management System Enhancement

**User Story**: As a content manager, I want to search and filter articles on the dashboard so that I can quickly find specific articles and manage content efficiently.

**Acceptance Criteria**:
- Search functionality to find articles by title, content, author, or tags
- Filter options for article status (Draft, In Review, Approved, Published, Archived)
- Filter options for date ranges (created, modified, published)
- Filter options for article categories or topics
- Sort functionality by date, title, status, or author
- Real-time search results as user types
- Clear/reset filters functionality
- Save search preferences for user sessions

**Technical Requirements**:
- Search component with debounced input
- Filter panel with multiple filter types
- Sort dropdown with various options
- Search API integration with backend
- Client-side filtering for performance
- URL state management for shareable searches
- Loading states and empty states
- Responsive design for mobile and desktop

**Dependencies**:
- Article management backend
- Search service implementation
- User authentication system
- Article metadata and indexing
- Dashboard UI framework

**Priority**: High
**Story Points**: 8
**Target Sprint**: Current sprint

## Story Context: 14-2-enhanced-user-prompt-with-seo-strategy

**Status**: ready-for-dev

**Epic**: SEO Optimization Framework

**User Story**: As a content creator, I want enhanced user prompts with integrated SEO strategy guidance so that I can provide clear, SEO-optimized instructions that result in higher-ranking content with better search visibility.

**Acceptance Criteria**:
- Enhanced user prompt interface with SEO strategy guidance embedded
- Keyword targeting and density recommendations displayed in prompt
- Search intent optimization suggestions for content type
- Semantic keyword variations and LSI keyword recommendations
- Content structure guidance based on SEO best practices
- Readability level recommendations (Grade 10-12 target)
- E-E-A-T principle reminders and guidance in prompts
- Competitor analysis insights integrated into prompt suggestions
- Content angle and unique value proposition guidance
- Target word count recommendations by section type
- Internal linking opportunities and suggestions
- Call-to-action optimization guidance

**Technical Requirements**:
- Enhanced user prompt component in article generation interface
- SEO strategy API integration for real-time suggestions
- Keyword research integration from existing keyword data
- Search intent classification and recommendations
- Content template suggestions based on target keywords
- Real-time SEO scoring for prompt inputs
- Prompt optimization suggestions with impact indicators
- Integration with existing section-processor.ts architecture
- User preference storage for prompt customization
- Performance requirements maintained (<2 second prompt loading)

**Dependencies**:
- Existing keyword research interface (Epic 3-1)
- Enhanced system prompt with E-E-A-T principles (Story 14-1)
- Section-processor.ts service architecture
- OpenRouter API integration for content generation
- Next.js 16 and React 19 architecture
- TypeScript strict mode compliance

**Priority**: High
**Story Points**: 8
**Target Sprint**: Current sprint

## Story Context: 14-4-seo-helper-functions

**Status**: ready-for-dev

**Epic**: SEO Optimization Framework

**User Story**: As a content developer, I want specialized SEO helper functions integrated into the content generation system so that I can automatically optimize articles for search engine performance with accurate keyword density, semantic variations, and SEO best practices.

**Acceptance Criteria**:
- calculateTargetDensity() function for optimal keyword density calculation
- generateSemanticKeywords() function for LSI keyword generation and variations
- getUserIntentSignals() function for search intent matching and optimization
- getStyleGuidance() function for writing style execution based on SEO requirements
- formatResearchSources() function with authority indicators and credibility signals
- Enhanced content briefing section with SEO recommendations
- Real-time SEO scoring and optimization suggestions
- Integration with existing section-processor.ts architecture
- Performance optimization for helper function execution (<100ms per function)
- Comprehensive error handling and fallback mechanisms

**Technical Requirements**:
- 6 new SEO helper functions implemented in TypeScript
- Helper function integration within existing section-processor.ts service
- Keyword density calculation with industry-standard algorithms
- Semantic keyword generation using LSI and NLP techniques
- Search intent classification (informational, navigational, commercial, transactional)
- Writing style guidance based on target audience and SEO goals
- Research source formatting with authority scoring
- Content briefing enhancement with SEO insights
- Unit tests for all helper functions with >95% coverage
- Integration tests with existing content generation workflow
- Performance monitoring and optimization for helper function execution

**Dependencies**:
- Enhanced system prompt with E-E-A-T principles (Story 14-1)
- Section-processor.ts service architecture
- OpenRouter API integration for content generation
- Research-optimizer.ts and context-manager.ts services
- Next.js 16 and React 19 architecture
- TypeScript strict mode compliance
- Keyword research interface (Epic 3-1)

**Priority**: High
**Story Points**: 8
**Target Sprint**: Current sprint

**Implementation Notes**:
- Helper functions should be modular and reusable across different content types
- Each function includes comprehensive error handling and validation
- Integration maintains backward compatibility with existing generation functionality
- Performance impact analysis shows minimal overhead to generation time
- Functions designed to work with existing token limits and constraints

## Story Context: 14-5-format-changes-and-content-structure

**Status**: ready-for-dev

**Epic**: Content Generation Enhancement

**User Story**: As a content creator, I want flexible formatting options and content structure controls so that I can generate articles with customized layouts, styling, and organizational patterns that match my specific content needs and brand guidelines.

**Acceptance Criteria**:
- Dynamic content structure selection with multiple layout options
- Customizable formatting rules for different article types and topics
- Flexible heading hierarchy management (H1-H6) with SEO optimization
- Content block organization with draggable/reorderable sections
- Template-based formatting with brand-specific style guidelines
- Rich text formatting options (bold, italics, lists, quotes, code blocks)
- Image and media placement controls within content structure
- Table of contents generation with customizable depth levels
- Content section grouping and categorization options
- Export format flexibility (markdown, HTML, PDF, JSON)
- Preview mode with real-time formatting updates
- Responsive formatting optimization for different devices

**Technical Requirements**:
- Content structure engine within existing section-processor.ts architecture
- Formatting rule engine with customizable templates
- Dynamic content block system with reordering capabilities
- Heading hierarchy optimizer with SEO best practices
- Rich text formatting parser and renderer
- Media placement and sizing algorithms
- Table of contents generator with anchor links
- Content export system with multiple format support
- Real-time preview system with live formatting updates
- Responsive design adaptation engine
- Template inheritance and customization system
- Performance optimization for structure processing (<200ms per operation)

**Dependencies**:
- Enhanced system prompt with E-E-A-T principles (Story 14-1)
- Section templates system (Story 14-3)
- Section-processor.ts service architecture
- OpenRouter API integration for content generation
- Research-optimizer.ts and context-manager.ts services
- Next.js 16 and React 19 architecture
- TypeScript strict mode compliance
- UI component library for formatting controls

**Priority**: High
**Story Points**: 8
**Target Sprint**: Current sprint

**Implementation Notes**:
- Content structure system should maintain backward compatibility with existing articles
- Formatting rules engine supports both global and article-specific customizations
- Dynamic content blocks enable flexible article organization without breaking SEO structure
- Export functionality preserves formatting and structure across all output formats
- Real-time preview system uses efficient diff algorithms for instant updates
- Performance monitoring ensures structure processing doesn't impact generation speed

## Story Context: 14-3-section-templates-system

**Status**: ready-for-dev

**Epic**: Content Generation Enhancement

**User Story**: As a content creator, I want a comprehensive section templates system so that I can generate consistently structured, SEO-optimized articles with appropriate word counts and formatting for each section type.

**Acceptance Criteria**:
- Section-specific templates with optimized word counts and structure
- Introduction template: 300-400 words with SEO-optimized hook and thesis statement
- H2 section templates: 500-700 words with topic authority building
- H3 subsection templates: detailed explanations with depth and examples
- Conclusion template: summary and call-to-action (200-300 words)
- FAQ template: common user questions with snippet-optimized answers
- Template validation system to ensure content quality standards
- Dynamic template selection based on article type and target keywords
- Template customization options for different content verticals
- Performance optimization for template processing (<500ms per section)

**Technical Requirements**:
- Section template engine within existing section-processor.ts architecture
- Template registry system for managing different section types
- Template validation with word count and structure checks
- Dynamic template selection based on content analysis
- Template customization interface for content creators
- Integration with existing SEO optimization functions
- Template performance caching for faster generation
- Template versioning and A/B testing capabilities
- Template analytics and performance tracking
- Multi-language template support for future expansion

**Dependencies**:
- Enhanced system prompt with E-E-A-T principles (Story 14-1)
- Section-processor.ts service architecture
- OpenRouter API integration for content generation
- Research-optimizer.ts and context-manager.ts services
- Next.js 16 and React 19 architecture
- TypeScript strict mode compliance
- SEO optimization framework (Epic 3-1)

**Priority**: High
**Story Points**: 5
**Target Sprint**: Current sprint

**Implementation Notes**:
- Templates should be modular and reusable across different content types
- Each template includes specific structure guidelines and SEO checkpoints
- Template system supports both predefined and custom templates
- Integration with existing content generation workflow maintains backward compatibility
- Template performance monitoring ensures generation speed requirements are met

## Story Context: 20-1-prompt-system-overhaul

**Status**: ready-for-dev

**Epic**: Content Generation System Optimization

**User Story**: As a content creator, I want an overhauled prompt system that delivers consistent, high-quality content generation so that I can rely on the system to produce articles that meet quality standards without extensive manual editing or revisions.

**Acceptance Criteria**:
- Completely redesigned prompt architecture with modular, reusable components
- Consistent content quality across all article types and topics
- Reduced generation failures and error rates by 80%
- Improved prompt clarity and specificity for better AI comprehension
- Standardized prompt templates for different content types (blog posts, articles, guides)
- Dynamic prompt adaptation based on content complexity and target audience
- Enhanced prompt validation system to prevent malformed requests
- Real-time prompt optimization suggestions for content creators
- Comprehensive prompt testing framework with quality metrics
- Backward compatibility with existing content generation workflow
- Performance optimization maintaining <3 minute generation times
- Multi-language prompt support for future expansion

**Technical Requirements**:
- New prompt architecture within existing section-processor.ts framework
- Modular prompt component system with inheritance and composition
- Prompt template engine with dynamic variable substitution
- Prompt validation system with syntax and semantic checks
- Quality scoring system for generated content (0-100 scale)
- A/B testing framework for prompt optimization
- Performance monitoring and analytics for prompt effectiveness
- Error handling and recovery mechanisms for failed generations
- Integration with existing SEO optimization functions
- Token optimization within existing 2800 token limits
- Caching system for frequently used prompt templates
- Real-time prompt preview and testing interface

**Dependencies**:
- Existing section-processor.ts service architecture
- OpenRouter API integration for content generation
- Research-optimizer.ts and context-manager.ts services
- Enhanced system prompt with E-E-A-T principles (Story 14-1)
- SEO helper functions (Story 14-4)
- Section templates system (Story 14-3)
- Next.js 16 and React 19 architecture
- TypeScript strict mode compliance
- Content quality assessment framework

**Priority**: High
**Story Points**: 13
**Target Sprint**: Current sprint

**Implementation Notes**:
- Prompt overhaul should maintain backward compatibility with existing articles
- Modular architecture enables easy maintenance and future enhancements
- Quality scoring system provides measurable improvements in content generation
- Performance optimization ensures generation speed requirements are maintained
- Comprehensive testing framework validates prompt effectiveness across content types
- Real-time optimization helps content creators achieve better results
- Error reduction targets aim to minimize manual intervention requirements

## Story Context: 20-2-batch-research-optimizer

**Status**: ready-for-dev

**Epic**: Content Generation System Optimization

**User Story**: As a content creator, I want an optimized batch research system that reduces API calls and improves generation speed so that I can create articles faster with lower costs while maintaining high-quality research sources.

**Acceptance Criteria**:
- Batch research system optimized to reduce API calls from 8-13 to 1-2 per article
- Comprehensive research query building covering entire article outline
- Intelligent source ranking and relevance scoring for each section
- Section-specific source mapping with top 8 relevant sources per section
- In-memory caching system with 30-minute TTL for research data
- Automatic cache cleanup for expired entries to prevent memory leaks
- Performance monitoring integration for API call tracking and cost management
- Fallback mechanisms when research queries fail to prevent blocking generation
- Duplicate source removal to ensure clean, unique research data
- Targeted research for complex articles with many sections (top 5 key sections)
- Real-time research cache statistics and monitoring capabilities

**Technical Requirements**:
- Enhanced `performBatchResearch()` function with comprehensive query optimization
- Improved `buildComprehensiveQuery()` function covering main keyword and top H2 sections
- Enhanced `buildTargetedQuery()` function for specific section research
- Advanced `rankSourcesByRelevance()` function with weighted scoring algorithm
- Section-specific source mapping with `getSectionResearchSources()` function
- In-memory cache management with `ArticleResearchCache` interface
- Cache TTL management and automatic cleanup with `cleanupExpiredCache()` function
- Research cache statistics with `getResearchCacheStats()` monitoring function
- API cost tracking integration with existing cost management system
- Performance monitoring integration with existing performance tracking
- Error handling and fallback mechanisms for failed research queries
- Source deduplication algorithm to remove duplicate URLs

**Dependencies**:
- Existing research-optimizer.ts service architecture
- Tavily research API integration for source fetching
- Performance monitoring system for API call tracking
- Supabase cost tracking system for API cost management
- Outline generator service for article structure analysis
- Next.js 16 and React 19 architecture
- TypeScript strict mode compliance

**Priority**: High
**Story Points**: 8
**Target Sprint**: Current sprint

**Implementation Notes**:
- Batch research optimization maintains backward compatibility with existing generation workflow
- In-memory caching provides significant performance improvements for repeated article generation
- Source relevance scoring ensures high-quality, section-specific research data
- Fallback mechanisms prevent research failures from blocking article generation
- Performance monitoring provides visibility into API usage and cost optimization
- Cache management prevents memory leaks and ensures optimal system performance
- Targeted research for complex articles balances quality with API efficiency

## Story Context: 20-3-parallel-section-processing

**Status**: ready-for-dev

**Epic**: Content Generation System Optimization

**User Story**: As a content creator, I want sections to generate simultaneously instead of sequentially so that my 8-section article completes in 2-3 minutes instead of 8 minutes.

**Acceptance Criteria**:
- Introduction generates first (sequential dependency requirement)
- All H2 sections generate in parallel (4+ simultaneous processing)
- H3 subsections process in parallel groups by parent H2 section
- Each H3 group waits for its parent H2 completion before starting
- Conclusion and FAQ generate in parallel after main sections complete
- Entire article completes within 3 minutes (60-70% improvement over 8 minutes)
- Failed sections are isolated and don't block other sections in same batch
- Individual sections can be retried independently without full article regeneration
- Concurrency limits prevent API rate limiting during multiple article generation
- System maintains stable performance under load with 10+ concurrent articles

**Technical Requirements**:
- Refactor generate-article.ts with phased parallel processing approach
- Phase 1: Sequential introduction generation (dependency requirement)
- Phase 2: Parallel H2 section processing using Promise.allSettled (4+ simultaneous)
- Phase 3: Parallel H3 subsection processing grouped by parent H2
- Phase 4: Parallel conclusion + FAQ generation
- Promise.allSettled implementation for parallel execution with error isolation
- Per-section error handling that doesn't block other sections
- Individual section retry logic for failed sections
- Concurrency limit manager with max 5 simultaneous generation limit
- Queue management for multiple article generation
- Enhanced article_progress table for parallel section tracking
- Real-time progress updates for parallel batches
- Performance monitoring for parallel batch timing and efficiency
- Resource allocation system for stable performance

**Dependencies**:
- Existing generate-article.ts Inngest function architecture
- Section-processor.ts service for individual section processing
- Batch research optimization from Story 20.2
- Performance monitoring system for metrics tracking
- OpenRouter API integration for content generation
- Next.js 16 and React 19 architecture
- TypeScript strict mode compliance
- Inngest background processing system

**Priority**: High
**Story Points**: 13
**Target Sprint**: Current sprint

**Implementation Notes**:
- Parallel processing reduces generation time from 8 minutes to <3 minutes
- Error isolation prevents one section failure from blocking others
- Concurrency management prevents API rate limiting issues
- Maintains backward compatibility with existing generation workflow
- Integrates with existing batch research and performance monitoring systems
- Provides significant performance improvement while maintaining content quality

## Story Context: 33-1-create-intent-workflow-with-organization-context

**Status**: ready-for-dev

**Epic**: 33 - Workflow Foundation & Organization Setup

**User Story**: As an organization admin, I want to create a new intent workflow and associate it with my organization, so that I can begin the content planning process with proper organizational context.

**Acceptance Criteria**:
- Database table creation (intent_workflows) with proper RLS policies
- API endpoint for workflow creation (POST /api/intent/workflows)
- Workflow record created with status 'step_0_auth'
- Workflow associated with organization via organization_id
- Response includes workflow ID and creation timestamp
- Organization isolation enforced (RLS)
- Only admin users can create workflows
- Idempotent creation (duplicate requests return existing workflow)

**Technical Requirements**:
- Supabase database with RLS policies for organization isolation
- Next.js API route following existing patterns
- Authentication using getCurrentUser() pattern
- TypeScript types for intent workflow
- Proper error handling and validation
- Audit trail integration
- Input validation and security measures

**Dependencies**:
- None (foundational story for Epic 33)
- Existing authentication system
- Supabase database infrastructure
- Current user management system

**Priority**: High
**Story Points**: 8
**Target Sprint**: Current sprint

**Implementation Notes**:
- This is a Producer story that creates foundational workflow records
- Follows established patterns from article generation system
- No UI events, only backend database operations
- Terminal state analytics only (workflow_created event)
- Must maintain organization isolation through RLS policies

## Story Context: 20-5-context-management-optimization

**Status**: ready-for-dev

**Epic**: Article Generation Performance Optimization

**User Story**: As a content creator, I want previous section context to be summarized efficiently so that token usage drops 40-50% and generation is faster.

**Acceptance Criteria**:
- Context is built incrementally (append-only) with previous sections compressed to key points
- Context assembly provides last section with more detail (400 characters) and earlier sections with compressed summaries (2-3 sentences)
- Total context window stays under 1500 tokens during generation
- Context is cached in memory with articleId key, no database reloads needed during generation
- Cache is cleared after article completion
- Token usage drops by 40-50% compared to full context approach
- Generation speed improves due to smaller prompts

**Technical Requirements**:
- Create context-manager.ts module with incremental summary builder
- Implement memory caching system with articleId key structure
- Add token usage monitoring and reporting for optimization tracking
- Integrate with existing section-processor.ts for compatibility
- Batch database section updates to reduce API calls
- Context building must complete in <50ms per section
- Memory usage stability during article generation sessions
- Cache operations with minimal overhead
- Integration with parallel processing from Story 20-3

**Dependencies**:
- Story 20-1 (Prompt System Overhaul) for context requirements
- Story 20-2 (Batch Research Optimizer) for caching patterns
- Story 20-3 (Parallel Section Processing) for concurrent access
- Story 20-4 (Smart Quality Retry System) for performance integration
- Existing section-processor.ts service architecture
- Performance monitoring system integration
- Next.js 16 and React 19 architecture
- TypeScript strict mode compliance

**Priority**: High
**Story Points**: 8
**Target Sprint**: Current sprint

**Implementation Notes**:
- Incremental building uses append-only pattern with 2-3 sentence summaries
- Memory caching uses Map with articleId keys and auto-cleanup
- Token optimization provides full detail for immediate previous section (400 chars)
- Context window management with 1500 token limit and intelligent truncation
- Batch updates reduce database calls during article generation
- Performance monitoring tracks context size, token count, cache hit rate, and generation speed

## Story Context: 32-2-efficiency-and-performance-metrics

**Status**: ready-for-dev

**Epic**: 32 - Analytics and Performance Monitoring

**User Story**: As a system administrator, I want comprehensive efficiency and performance metrics for the content generation system so that I can monitor system health, identify bottlenecks, optimize resource usage, and ensure reliable service delivery.

**Acceptance Criteria**:
- Real-time system performance metrics collection for article generation pipeline
- API usage efficiency tracking with cost optimization insights
- Generation speed metrics per section and per article with trend analysis
- Resource utilization monitoring (CPU, memory, database connections)
- Error rate tracking with detailed failure categorization and root cause analysis
- Concurrent capacity monitoring with system load indicators and scaling recommendations
- Cache hit rate optimization for research data and context management
- Token usage efficiency metrics with cost per article analysis
- Database query performance monitoring with slow query identification
- WebSocket connection health and real-time update latency tracking
- Mobile performance metrics including touch response times and rendering performance
- System health dashboard with alerting for threshold breaches
- Historical performance data with capacity planning insights

**Technical Requirements**:
- Performance monitoring service extending existing performance-monitor.ts patterns
- Real-time metrics collection via WebSocket and Server-Sent Events
- Time-series database integration for historical performance data
- API endpoint for performance metrics with efficient data aggregation
- Alerting system with configurable thresholds and notification channels
- Performance analytics dashboard with responsive design
- Integration with existing cost tracking and API usage monitoring
- Mobile performance monitoring extending existing mobile/performance-monitor.ts
- Database performance monitoring with query analysis and optimization recommendations
- Cache performance tracking for research and context management systems
- Resource utilization monitoring for system capacity planning
- Error tracking and categorization system with detailed analytics

**Dependencies**:
- Story 32-1 (User Experience Metrics Tracking) for metrics foundation patterns
- Existing performance monitoring infrastructure (performance-monitor.ts)
- Mobile performance monitoring patterns (mobile/performance-monitor.ts)
- Real-time infrastructure from Story 15-1 (article status display)
- Cost tracking and API usage monitoring systems
- Next.js 16 and React 19 architecture
- TypeScript strict mode compliance
- Supabase database for metrics storage
- WebSocket infrastructure for real-time updates

**Priority**: High
**Story Points**: 13
**Target Sprint**: Current sprint

**Implementation Notes**:
- Build on existing performance monitoring patterns from performance-monitor.ts
- Extend mobile performance monitoring from mobile/performance-monitor.ts
- Integrate with existing cost tracking and API usage systems
- Use real-time infrastructure patterns from article status display
- Ensure multi-tenant isolation for all performance metrics
- Follow existing dashboard patterns for performance visualization
- Implement comprehensive error tracking and categorization
- Provide actionable insights for system optimization
- Support capacity planning with historical trend analysis

## Story Context: 31-1-responsive-breakpoints-and-navigation

**Status**: ready-for-dev

**Epic**: 31 - Responsive Design & Mobile Experience

**User Story**: As a mobile user, I want navigation that adapts to my screen size, so that I can easily navigate the app on any device.

**Acceptance Criteria**:
- Mobile Breakpoint (< 640px): Sidebar collapses to hamburger menu, notification bell moves to overflow menu, touch targets minimum 44px, slide-out drawer pattern
- Tablet Breakpoint (640px - 1024px): Layout adapts with adjusted spacing, navigation accessible, sidebar collapsible but not hidden, content reflows appropriately
- Desktop Breakpoint (1024px+): Full sidebar visible with all navigation items, notification bell in header, optimal screen real estate usage, hover states and keyboard navigation functional

**Technical Requirements**:
- Sidebar Component Enhancement: Extend existing shadcn/ui sidebar with responsive behavior using current useIsMobile hook pattern
- Breakpoint Detection: Leverage Tailwind CSS breakpoints (sm: 640px, lg: 1024px) with existing breakpoint detection
- Mobile Menu Pattern: Implement slide-out drawer using existing Sheet component pattern
- Touch Optimization: Minimum 44px touch targets following existing button size patterns
- Keyboard Navigation: Full keyboard accessibility using existing ARIA patterns
- Layout Adaptations: Container responsive from single column (mobile) to multi-column (desktop)
- Performance Requirements: <3 second load time on 4G, <200ms touch response, 60fps animations

**Dependencies**:
- Next.js 16 and React 19 architecture
- Existing shadcn/ui sidebar component (/components/ui/sidebar.tsx)
- Current useIsMobile hook pattern
- Tailwind CSS breakpoint system
- Existing design tokens from globals.css

**Priority**: High
**Story Points**: 8
**Target Sprint**: Sprint 3-4

**Implementation Notes**:
- Apply lessons from CSS specificity crisis (Jan 14, 2026) with inline style fallbacks for critical dimensions
- Use LayoutDiagnostic integration for debugging complex responsive layouts
- Mobile-first approach with progressive enhancement for tablet/desktop
- Extend existing components rather than creating new ones
- Performance optimization with lazy loading and code splitting for mobile

## Story Context: 31-2-mobile-layout-adaptations

**Status**: ready-for-dev

**Epic**: 31 - Responsive Design & Mobile Experience

**User Story**: As a mobile user, I want content layouts that adapt seamlessly to my screen size, so that I can read, interact with, and manage content efficiently on any device.

**Acceptance Criteria**:
- Mobile Content Layout: Single-column layout with optimal reading width (320px-375px), touch-friendly spacing, swipeable cards for article lists, pull-to-refresh functionality
- Tablet Content Layout: Two-column layout for article lists, adaptive content width (640px-768px), enhanced touch targets, gesture-based navigation
- Desktop Content Layout: Multi-column grid layouts, hover states and tooltips, keyboard shortcuts, drag-and-drop functionality
- Content Component Adaptations: Article cards resize appropriately, text remains readable at all sizes, images scale responsively, forms adapt to touch/keyboard input
- Dashboard Adaptations: Compact mobile dashboard with essential actions, tablet dashboard with expanded controls, desktop dashboard with full functionality

**Technical Requirements**:
- Responsive Grid System: Extend existing CSS Grid layouts with responsive breakpoints using Tailwind's grid system
- Component Adaptation Engine: Create HOC or hook system for responsive component behavior
- Touch Interaction System: Implement swipe gestures, touch feedback, and mobile-specific interactions
- Content Optimization: Responsive typography scaling, image optimization, lazy loading for mobile
- Layout State Management: Store and restore layout preferences across devices
- Performance Requirements: <2 second content load on mobile, <100ms layout transitions, 60fps animations
- Accessibility: WCAG 2.1 AA compliance across all device types, touch accessibility, screen reader optimization

**Dependencies**:
- Story 31-1 (Responsive Breakpoints and Navigation) for breakpoint system
- Next.js 16 and React 19 architecture
- Existing shadcn/ui component library
- Current responsive design patterns in globals.css
- LayoutDiagnostic tool for CSS debugging
- Performance monitoring system

**Priority**: High
**Story Points**: 13
**Target Sprint**: Sprint 3-4

**Implementation Notes**:
- Apply CSS specificity crisis lessons with inline style protection for critical layout dimensions
- Use LayoutDiagnostic extensively for complex responsive layout debugging
- Mobile-first development approach with progressive enhancement
- Leverage existing component patterns and extend rather than replace
- Implement comprehensive testing across all viewport sizes
- Consider offline functionality for mobile users
- Optimize for touch interactions with proper feedback mechanisms
- Ensure content readability and accessibility at all screen sizes

## Story Context: 31-3-mobile-performance-and-touch-optimization

**Status**: ready-for-dev

**Epic**: 31 - Responsive Design & Mobile Experience

**User Story**: As a mobile user, I want optimized performance and touch interactions so that the app responds quickly to my actions and feels smooth and responsive on my mobile device.

**Acceptance Criteria**:
- Touch response time under 100ms for all interactive elements
- 60fps animations and transitions on mobile devices
- Optimized asset loading with lazy loading for images and components
- Touch feedback with visual and haptic responses
- Gesture support for swipe, pinch, and long-press interactions
- Mobile-specific performance optimizations (reduced JavaScript bundle, optimized images)
- Offline functionality for core features with service worker implementation
- Battery usage optimization to minimize power consumption
- Network-aware performance adaptation (4G, 3G, WiFi optimization)
- Memory management to prevent crashes on low-end devices

**Technical Requirements**:
- Performance monitoring with Core Web Vitals tracking (LCP, FID, CLS)
- Touch event optimization with proper event handling and debouncing
- Gesture recognition system for mobile-specific interactions
- Lazy loading implementation for images, components, and routes
- Service worker for offline functionality and caching
- Bundle optimization with code splitting for mobile
- Image optimization with responsive images and WebP format
- Memory leak prevention and monitoring
- Network performance adaptation with quality switching
- Battery API integration for power-aware performance

**Dependencies**:
- Story 31-1 (Responsive Breakpoints and Navigation) for mobile layout foundation
- Story 31-2 (Mobile Layout Adaptations) for responsive component behavior
- Next.js 16 and React 19 architecture
- Existing performance monitoring system
- shadcn/ui component library with mobile optimizations
- Touch gesture library integration
- Service worker implementation
- Image optimization pipeline

**Priority**: High
**Story Points**: 8
**Target Sprint**: Sprint 3-4

**Implementation Notes**:
- Apply CSS specificity crisis lessons with inline style protection for critical mobile layouts
- Use LayoutDiagnostic for mobile-specific layout debugging and performance analysis
- Mobile-first development approach with progressive enhancement
- Implement comprehensive touch testing across different device types and screen sizes
- Consider offline functionality as a key mobile performance feature
- Optimize for battery life and network conditions
- Ensure accessibility standards are maintained on mobile devices
- Test performance on low-end devices and slower network connections

## Story Context: 30-3-design-token-documentation-and-compliance

**Status**: ready-for-dev

**Epic**: Design System Foundation

**User Story**: As a design system maintainer, I want comprehensive documentation of design tokens and component rules so that all team members follow the design system consistently.

**Acceptance Criteria**:
- Comprehensive documentation of all design tokens with usage examples
- Semantic color usage guidelines and anti-patterns documentation
- Automated compliance checking system with ESLint rules and pre-commit hooks
- Component governance framework with review processes
- Developer education materials and interactive component playground
- CI/CD integration for design system compliance validation

**Technical Requirements**:
- Documentation structure in `/docs/design-system/` with comprehensive coverage
- ESLint plugin for design system compliance checking
- Pre-commit hooks for validation of design token usage
- CI/CD workflows for automated compliance checking
- Interactive component playground for developer education
- Compliance reporting dashboard with trend analysis

**Dependencies**:
- Story 30-1: CSS Design Tokens & Variables (token system foundation)
- Story 30-2: Component Library & Patterns (component foundation)
- Next.js 16 and React 19 architecture
- TypeScript strict mode compliance
- shadcn/ui component library

**Priority**: High
**Story Points**: 13
**Target Sprint**: Current sprint

**Implementation Notes**:
- Build on existing token system from Story 30.1 and component library from Story 30.2
- Implement automated compliance checking to prevent CSS specificity issues
- Create comprehensive documentation for developer onboarding and consistency
- Establish governance framework for long-term design system maintenance
- Include interactive examples and playground for hands-on learning

## Story Context: 23-2-advanced-activity-feed

**Status**: ready-for-dev

**Epic**: Epic 23 - Dashboard Integration and Real-time Features

**User Story**: As a team collaborator, I want real-time visibility of team content activities so that I can coordinate work and avoid duplicate efforts.

**Acceptance Criteria**:
- Real-time activity feed displays latest articles, comments, and research updates
- User behavior analytics measure dashboard engagement
- Alerts trigger for synchronization failures with detailed error logs
- Performance metrics tracked and reported for system health
- All users see updates within 2 seconds of activity occurrence
- Activity history maintained for last 30 days
- Each activity shows user, action, timestamp, and relevant content details
- Activities filterable by type, user, and date range

**Technical Requirements**:
- Real-time Supabase subscriptions with 2-second update latency
- New `activities` table with automatic activity logging triggers
- React Context + Custom Hooks for state management
- Activity feed component with pagination and infinite scroll
- User behavior tracking for engagement metrics
- Performance monitoring for latency and sync health
- Mobile optimization with push notification support
- WCAG 2.1 AA compliance with keyboard navigation

**Dependencies**:
- Existing dashboard architecture and layout
- User authentication and organization context
- Article management and progress tracking systems
- Notification infrastructure for mobile push notifications
- Error boundary components and patterns
- Real-time infrastructure patterns from Story 23-1

**Priority**: High
**Story Points**: 13
**Target Sprint**: Current sprint

**Implementation Notes**:
- Leverage existing Supabase subscription patterns from Story 23-1
- Follow established dashboard component structure and styling
- Use existing pagination and infinite scroll patterns
- Maintain backward compatibility with current dashboard
- Support 1000+ concurrent users with <500ms response times
- Database triggers ensure automatic activity logging
- Memory-efficient subscription management prevents leaks

## Story Context: 30-1-css-design-tokens-and-variables

**Status**: backlog

**Epic**: Design System Foundation

**User Story**: As a frontend developer, I want a comprehensive CSS design tokens and variables system so that I can maintain consistent styling, enable theme switching, and improve maintainability across the entire application.

**Acceptance Criteria**:
- Comprehensive design token system covering colors, typography, spacing, shadows, and borders
- CSS custom properties (variables) implemented for all design tokens
- Semantic token naming convention following design system best practices
- Light/dark theme support with automatic theme switching
- Responsive design tokens for different screen sizes
- Component-specific token variations for UI consistency
- Token documentation with usage examples and guidelines
- Token validation system to ensure consistency
- Migration strategy for existing hardcoded styles
- Performance optimization for token usage

**Technical Requirements**:
- Design token architecture using CSS custom properties
- Token hierarchy with global, semantic, and component levels
- Theme system with CSS custom property switching
- Responsive token system with media query integration
- Token build process and validation pipeline
- Integration with existing TailwindCSS setup
- TypeScript definitions for design tokens
- Token documentation generation system
- Migration tools for existing styles
- Performance monitoring for token usage

**Dependencies**:
- Existing TailwindCSS configuration
- Next.js 16 and React 19 architecture
- Component library structure (shadcn/ui)
- TypeScript strict mode compliance
- Build system integration
- Documentation system

**Priority**: Medium
**Story Points**: 8
**Target Sprint**: Future sprint

**Implementation Notes**:
- Design tokens should follow W3C CSS Custom Properties specification
- Token naming should use semantic naming conventions (e.g., --color-primary-500)
- Theme switching should be seamless and performant
- Token system should be extensible for future design needs
- Migration should be incremental to avoid breaking existing functionality
- Documentation should be comprehensive and developer-friendly

## Story Context: 29-1-homepage-hero-section-and-value-proposition

**Status**: ready-for-dev

**Epic**: Homepage and Marketing Enhancement

**User Story**: As a potential customer visiting the Infin8Content homepage, I want to immediately understand the value proposition and key benefits through an engaging hero section so that I can quickly grasp how this AI-powered content generation platform will solve my content creation challenges and be motivated to sign up or learn more.

**Acceptance Criteria**:
- Compelling hero section with clear value proposition headline
- Engaging subheading that communicates AI-powered content generation benefits
- Key value propositions presented in scannable format (3-4 core benefits)
- Strong call-to-action buttons for primary user journeys (Start Free Trial, View Demo, Pricing)
- Professional, modern design that reflects AI/technology sophistication
- Responsive layout optimized for desktop, tablet, and mobile devices
- Loading performance optimization (hero content loads within 1 second)
- Accessibility compliance with proper heading hierarchy and screen reader support
- Social proof elements (customer count, testimonials, trust indicators)
- Visual elements that reinforce the AI content generation concept

**Technical Requirements**:
- Hero section component built with existing design system (shadcn/ui + Tailwind CSS)
- Responsive grid layout using Tailwind's responsive utilities
- Optimized imagery and graphics for fast loading
- Component integration with existing authentication flow for CTAs
- A/B testing support for headline and CTA variations
- SEO optimization with proper semantic HTML and meta tags
- Analytics integration for hero section engagement tracking
- Content management capabilities for hero copy updates
- Integration with existing theme system for consistent branding
- Performance monitoring for Core Web Vitals compliance

**Dependencies**:
- Next.js 16 App Router architecture
- Existing component library (shadcn/ui)
- Tailwind CSS styling system
- Supabase authentication system
- Current design tokens and brand guidelines
- Analytics and monitoring infrastructure
- Content management system for hero updates

**Priority**: High
**Story Points**: 8
**Target Sprint**: Current sprint

**Implementation Notes**:
- Hero section should be the first content users see above the fold
- Value proposition should focus on time savings, content quality, and SEO benefits
- Design should reflect the sophisticated AI technology behind the platform
- Mobile-first approach with progressive enhancement for larger screens
- Consider animation and micro-interactions for enhanced user engagement
- Ensure hero section works seamlessly with existing navigation and authentication

## Story Context: 29-2-problem-solution-and-product-capabilities

**Status**: ready-for-dev

**Epic**: Homepage and Marketing Enhancement

**User Story**: As a potential customer evaluating Infin8Content, I want to clearly understand the problems this platform solves and the comprehensive product capabilities so that I can make an informed decision about whether this AI-powered content generation solution meets my specific needs and delivers tangible value for my content creation workflow.

**Acceptance Criteria**:
- Clear problem statement section addressing common content creation challenges
- Comprehensive solution overview showing how Infin8Content addresses each problem
- Detailed product capabilities showcase with specific feature explanations
- Use case examples for different user personas (content marketers, bloggers, agencies)
- Interactive feature demonstration elements with hover states and micro-interactions
- Comparison table highlighting advantages over manual content creation
- Technical capability indicators (AI models, SEO optimization, performance metrics)
- Integration capabilities展示 with popular platforms and tools
- Scalability information for different business sizes and content volumes
- Trust signals and validation points (customer success metrics, reliability data)

**Technical Requirements**:
- Problem-solution section component built with existing design system
- Interactive capability cards with expandable detail views
- Comparison table component with responsive design
- Use case carousel or tabbed interface for different personas
- Animated feature showcase with smooth transitions
- Performance optimization for fast loading and smooth interactions
- Mobile-responsive design ensuring readability on all devices
- Accessibility compliance with proper heading structure and screen reader support
- Analytics integration for user engagement tracking
- Content management capabilities for easy updates to capabilities

**Dependencies**:
- Next.js 16 App Router architecture
- Existing component library (shadcn/ui)
- Tailwind CSS styling system
- Hero section from Story 29-1 for consistent design language
- Current design tokens and brand guidelines
- Analytics and monitoring infrastructure
- Content management system for capability updates

**Priority**: High
**Story Points**: 8
**Target Sprint**: Current sprint

**Implementation Notes**:
- Problem-solution section should flow naturally from hero section value proposition
- Capabilities showcase should use visual hierarchy to highlight key features
- Interactive elements should enhance understanding without overwhelming users
- Mobile-first approach with progressive enhancement for larger screens
- Consider using icons and visual elements to represent different capabilities
- Ensure section works seamlessly with existing navigation and user flow
- Content should be easily updatable through the CMS for future capability additions

## Story Context: 29-3-trust-signals-and-social-proof

**Status**: ready-for-dev

**Epic**: Homepage and Marketing Enhancement

**User Story**: As a potential customer considering Infin8Content, I want to see compelling trust signals and social proof throughout the homepage so that I can feel confident in the platform's reliability, effectiveness, and the value it delivers to other content creators like me.

**Acceptance Criteria**:
- Customer testimonials section with authentic quotes and results from real users
- Customer logos showcase featuring well-known brands using the platform
- Usage statistics and metrics (articles generated, time saved, SEO improvements)
- Trust badges and certifications (security, privacy, industry standards)
- Social media integration showing real-time activity and community engagement
- Case study highlights with measurable results and ROI data
- Expert endorsements and industry recognition
- User-generated content examples and success stories
- Live demo or trial signup conversion metrics
- Money-back guarantee or risk-free trial messaging
- Security and compliance indicators (GDPR, SOC 2, data protection)
- Community size and growth metrics showing platform adoption

**Technical Requirements**:
- Testimonials carousel or grid component with responsive design
- Customer logos section with optimized image loading and hover effects
- Real-time statistics dashboard with animated counters
- Trust badges component with proper attribution and links
- Social media feed integration with API connections
- Case study cards with expandable detail views
- Expert endorsement section with credential verification
- User-generated content gallery with filtering capabilities
- Conversion tracking and analytics integration
- Security compliance section with documentation links
- Community metrics display with real-time updates
- Performance optimization for fast loading and smooth animations

**Dependencies**:
- Next.js 16 App Router architecture
- Existing component library (shadcn/ui)
- Tailwind CSS styling system
- Hero section from Story 29-1 for consistent design language
- Problem-solution section from Story 29-2 for contextual flow
- Current design tokens and brand guidelines
- Analytics and monitoring infrastructure
- Content management system for testimonials and social proof updates
- Social media API integrations
- Customer relationship management system for testimonials

**Priority**: High
**Story Points**: 5
**Target Sprint**: Current sprint

**Implementation Notes**:
- Trust signals should be strategically placed throughout the homepage for maximum impact
- Testimonials should include specific metrics and results for credibility
- Customer logos should be optimized for fast loading without quality loss
- Statistics should use animated counters for visual engagement
- Social proof elements should be easily updatable through the CMS
- Consider A/B testing different trust signal placements and formats
- Ensure all testimonials and endorsements have proper permissions
- Mobile-first approach with responsive trust signal layouts
- Integration with existing analytics to track trust signal effectiveness
- Regular updates to social proof content to maintain freshness and relevance

## Story Context: 22-1-generation-progress-visualization

**Status**: ready-for-dev

**Epic**: Content Generation System Optimization

**User Story**: As a content creator, I want to see real-time visual progress of article generation so that I can track the generation process, understand completion status, and know exactly when my articles will be ready.

**Acceptance Criteria**:
- Real-time progress bar showing overall article generation completion percentage
- Section-by-section progress visualization with current status indicators
- Time remaining estimates based on current generation speed
- Visual indicators for different generation phases (research, writing, optimization)
- Progress updates without page refresh using WebSocket or Server-Sent Events
- Failed section indicators with retry options
- Generation speed metrics and performance indicators
- Concurrent article generation progress tracking
- Mobile-responsive progress visualization
- Progress history and analytics for generation performance

**Technical Requirements**:
- WebSocket or Server-Sent Events implementation for real-time updates
- Progress tracking system integrated with generate-article.ts Inngest function
- Section-level progress monitoring with status states (pending, in-progress, completed, failed)
- Time estimation algorithm based on historical generation data
- Progress visualization components using React and shadcn/ui
- Real-time dashboard integration with existing article management system
- Performance metrics collection and display
- Error state handling with visual feedback
- Concurrent generation progress management
- Mobile-responsive design implementation

**Dependencies**:
- Parallel section processing from Story 20-3
- Real-time article status display from Story 15-1
- Performance monitoring system integration
- WebSocket infrastructure setup
- Next.js 16 and React 19 architecture
- TypeScript strict mode compliance
- shadcn/ui component library
- Inngest background processing system

**Priority**: High
**Story Points**: 8
**Target Sprint**: Current sprint

**Implementation Notes**:
- Progress visualization should integrate seamlessly with existing dashboard
- Real-time updates provide immediate feedback on generation status
- Time estimates improve with more historical data
- Error handling ensures users can retry failed sections easily
- Mobile design ensures accessibility across all devices
- Performance metrics help users understand generation efficiency

## Story Context: 14-6-seo-testing-and-validation

**Status**: ready-for-dev

**Epic**: SEO Optimization Framework

**User Story**: As a content manager, I want comprehensive SEO testing and validation tools so that I can verify content quality, measure SEO performance, and ensure all generated articles meet search engine optimization standards before publication.

**Acceptance Criteria**:
- Automated SEO quality scoring system for all generated content
- Real-time SEO validation during content creation process
- Keyword density analysis with optimal range recommendations
- Readability score assessment with Grade 10-12 target validation
- E-E-A-T principle compliance checking (Expertise, Authoritativeness, Experience, Trustworthiness)
- Meta description and title tag optimization validation
- Internal linking structure analysis and recommendations
- Image alt text and media optimization checks
- Mobile-friendliness and page speed impact assessment
- Schema markup validation for rich snippet opportunities
- Competitor content comparison and gap analysis
- Historical SEO performance tracking and trend analysis
- Content freshness and update recommendations
- Search intent alignment validation
- LSI keyword usage and semantic analysis

**Technical Requirements**:
- SEO testing engine integrated with existing content generation workflow
- Real-time validation API with sub-second response times
- Comprehensive SEO scoring algorithm with weighted criteria
- Keyword density calculator with industry-standard ranges
- Readability analysis integration (Flesch-Kincaid, Gunning Fog)
- E-E-A-T signal detection and scoring system

## Story Context: 33-4-enable-intent-engine-feature-flag

**Status**: ready-for-dev

**Epic**: 33 - Workflow Foundation & Organization Setup

**User Story**: As a system administrator, I want to enable the intent engine feature flag so that the intent workflow system becomes active and users can begin using the intent-based content planning functionality.

**Acceptance Criteria**:
- Feature flag system implementation for intent engine activation
- Database flag configuration with organization-level control
- API endpoint for feature flag management (GET/POST /api/features/intent-engine)
- Feature flag state persistence in database with audit trail
- Organization-specific feature flag settings with inheritance from global defaults
- Real-time feature flag updates without system restart
- Feature flag validation system to prevent invalid states
- Feature flag monitoring and analytics for usage tracking
- Rollback capability for feature flag changes
- Feature flag permissions with admin-only access controls
- Feature flag change notifications to system administrators
- Integration with existing workflow system for conditional activation

**Technical Requirements**:
- Feature flags table creation with proper RLS policies
- Feature flag service implementation with caching layer
- API endpoints following existing patterns from article generation system
- TypeScript types for feature flag configuration and state
- Real-time feature flag propagation using WebSocket or Server-Sent Events
- Feature flag validation with schema checking
- Audit trail integration for feature flag changes
- Performance monitoring for feature flag evaluation
- Error handling and fallback mechanisms for flag failures
- Integration with existing authentication and authorization systems
- Feature flag analytics and usage tracking
- Database migrations for feature flag infrastructure

**Dependencies**:
- Story 33-1 (Create Intent Workflow with Organization Context) for workflow foundation
- Story 33-2 (Intent Data Collection Interface) for user interface components
- Story 33-3 (Intent Processing Engine) for core processing logic
- Existing authentication system using getCurrentUser() pattern
- Supabase database infrastructure with RLS policies
- Next.js API route patterns
- Real-time infrastructure from existing article status system
- Performance monitoring system integration

**Priority**: High
**Story Points**: 5
**Target Sprint**: Current sprint

**Implementation Notes**:
- This is an Aggregator story that enables functionality created by other stories
- Feature flag system should follow established patterns from modern SaaS applications
- Organization-level control allows for gradual rollout and testing
- Real-time updates ensure immediate effect without system restarts
- Comprehensive audit trail provides visibility into feature flag changes
- Rollback capability ensures safe feature activation and deactivation
- Integration with existing systems maintains architectural consistency
- Performance optimization ensures minimal overhead for flag evaluation
- Security controls prevent unauthorized feature flag manipulation
- Meta tag optimization validator with length and character checks
- Internal linking analysis with authority flow calculation
- Media optimization checker for images and videos
- Mobile usability testing integration
- Page speed impact assessment tools
- Schema markup validator for structured data
- Competitor analysis API integration
- Performance tracking database with historical data
- Content freshness detection and alerting system
- Search intent classification validation
- Semantic analysis engine for LSI keyword usage

**Dependencies**:
- Enhanced system prompt with E-E-A-T principles (Story 14-1)
- Enhanced user prompt with SEO strategy guidance (Story 14-2)
- SEO helper functions (Story 14-4)
- Section templates system (Story 14-3)
- Format changes and content structure (Story 14-5)
- Section-processor.ts service architecture
- OpenRouter API integration for content generation
- Research-optimizer.ts and context-manager.ts services
- Next.js 16 and React 19 architecture
- TypeScript strict mode compliance
- Keyword research interface (Epic 3-1)

**Priority**: High
**Story Points**: 8
**Target Sprint**: Current sprint

**Implementation Notes**:
- SEO testing system should provide actionable feedback for content improvement
- Real-time validation helps creators optimize content during the creation process
- Comprehensive scoring system covers all major SEO ranking factors
- Integration with existing workflow maintains seamless user experience
- Performance monitoring ensures testing doesn't impact content creation speed
- Historical tracking enables long-term SEO strategy optimization
- Competitor analysis provides context for content quality benchmarks
- Mobile and page speed checks ensure technical SEO requirements are met

## Story Context: 22-2-performance-metrics-dashboard

**Status**: ready-for-dev

**Epic**: Content Generation System Optimization

**User Story**: As a content manager, I want a comprehensive performance metrics dashboard so that I can monitor article generation efficiency, track system performance, and identify optimization opportunities in real-time.

**Acceptance Criteria**:
- Real-time dashboard displaying key performance metrics for article generation
- Generation speed metrics showing average time per article and per section
- API usage tracking with cost analysis and budget monitoring
- Success/failure rate visualization with trend analysis over time
- Concurrent generation capacity monitoring and system load indicators
- Quality score distribution and content performance analytics
- Historical performance data with date range filtering capabilities
- Performance alerts and notifications for threshold breaches
- Export functionality for performance reports and analytics data
- Mobile-responsive dashboard design for on-the-go monitoring
- User role-based access to different metric levels and reports
- Integration with existing monitoring and alerting systems

**Technical Requirements**:
- Dashboard UI components built with React and shadcn/ui framework
- Real-time data visualization using Chart.js or similar charting library
- WebSocket integration for live performance metric updates
- Performance metrics API endpoint with efficient data aggregation
- Time-series database integration for historical performance data
- Real-time alerting system with configurable thresholds
- Data export functionality with CSV/PDF format support
- Responsive design implementation for mobile and desktop access
- Authentication and authorization integration with existing user system
- Performance optimization for dashboard loading (<2 seconds)
- Caching system for frequently accessed metric data
- Integration with existing cost tracking and monitoring systems

**Dependencies**:
- Real-time infrastructure from Story 15-1 (article status display)
- Performance monitoring system integration
- WebSocket infrastructure setup
- Next.js 16 and React 19 architecture
- TypeScript strict mode compliance
- shadcn/ui component library
- Existing cost tracking and API usage monitoring
- User authentication and authorization system
- Database for performance metrics storage
- Chart visualization library integration

**Priority**: High
**Story Points**: 8
**Target Sprint**: Current sprint

**Implementation Notes**:
- Dashboard should provide actionable insights for performance optimization
- Real-time updates enable immediate response to performance issues
- Historical data tracking supports long-term performance analysis
- Mobile design ensures accessibility for content managers on any device
- Integration with existing systems maintains data consistency
- Export functionality supports business reporting requirements
- Role-based access ensures appropriate data visibility levels
- Performance optimization ensures dashboard remains responsive under load

## Story Context: 32-3-analytics-dashboard-and-reporting

**Status**: complete

**Epic**: 32 - Analytics and Performance Monitoring

**User Story**: As a business administrator, I want a comprehensive analytics dashboard and reporting system so that I can track content performance, user engagement, system utilization, and business metrics to make data-driven decisions and demonstrate ROI.

**Acceptance Criteria**:
- Comprehensive analytics dashboard with real-time data visualization and key performance indicators
- Content performance analytics tracking article views, engagement rates, and SEO rankings
- User behavior analytics showing session duration, bounce rates, and conversion funnels
- System utilization metrics displaying API usage, generation statistics, and resource consumption
- Business intelligence reporting with revenue tracking, cost analysis, and ROI calculations
- Customizable date range filtering with comparative analysis (period-over-period, year-over-year)
- Exportable reports in multiple formats (PDF, CSV, Excel) with scheduled delivery options
- Interactive data visualizations with drill-down capabilities and detailed insights
- Alert and notification system for critical metric thresholds and anomalies
- Role-based access control with different dashboard views for different user types
- Mobile-responsive analytics interface for on-the-go monitoring
- Historical data retention with trend analysis and predictive insights

**Technical Requirements**:
- Analytics dashboard UI built with React and shadcn/ui components
- Data visualization library integration (Chart.js or Recharts) for interactive charts
- Real-time data aggregation service with efficient query optimization
- Time-series database integration for historical analytics data storage
- Analytics API endpoints with proper authentication and authorization
- Report generation engine with template-based report creation
- Export service with format conversion and scheduled delivery capabilities
- Alert system with configurable thresholds and notification channels
- Data caching layer for improved dashboard performance
- Integration with existing performance monitoring and cost tracking systems
- Mobile-responsive design with touch-optimized interactions
- Accessibility compliance with WCAG 2.1 AA standards

**Dependencies**:
- Story 32-1 (User Experience Metrics Tracking) for analytics foundation
- Story 32-2 (Efficiency and Performance Metrics) for system performance data
- Existing performance monitoring infrastructure (performance-monitor.ts)
- Cost tracking and API usage monitoring systems
- Next.js 16 and React 19 architecture
- TypeScript strict mode compliance
- Supabase database for analytics data storage
- Real-time infrastructure from Story 15-1 (article status display)
- User authentication and authorization system

**Priority**: High
**Story Points**: 13
**Target Sprint**: Current sprint

**Implementation Notes**:
- Build on existing performance monitoring patterns from Story 32-2
- Extend user experience tracking from Story 32-1 for comprehensive analytics
- Integrate with existing cost tracking and API usage systems
- Use real-time infrastructure patterns from article status display
- Ensure data privacy and compliance with analytics collection
- Implement efficient data aggregation for dashboard performance
- Provide actionable insights with clear visual representations
- Support both real-time and historical data analysis
- Design for scalability with growing data volumes
- Include comprehensive error handling and data validation

## Story Context: 20-4-smart-quality-retry-system

**Status**: ready-for-dev

**Epic**: Content Generation System Optimization

**User Story**: As a content creator, I want an intelligent quality retry system that automatically detects and fixes content quality issues so that I can publish high-quality articles without manual editing or revision cycles.

**Acceptance Criteria**:
- Automatic quality assessment for all generated content sections
- Smart retry logic that identifies specific quality issues (readability, length, coherence, SEO compliance)
- Up to 3 automatic retry attempts per section with progressive prompt improvements
- Quality scoring system with minimum threshold requirements (70+ score)
- Specific issue detection: keyword density, readability level, content coherence, factual accuracy
- Adaptive prompt enhancement based on failure reasons
- Manual override option for content creators to accept/retry rejected content
- Comprehensive retry logging with success/failure analytics
- Performance optimization maintaining <3 minute total generation time including retries
- Fallback to original content if all retry attempts fail

**Technical Requirements**:
- Quality assessment engine integrated within section-processor.ts architecture
- Multi-dimensional scoring algorithm (readability, SEO, coherence, completeness)
- Smart retry controller with progressive prompt enhancement
- Issue classification system for targeted retry strategies
- Adaptive prompt templates for different failure types
- Retry attempt tracking and analytics system
- Performance monitoring for retry impact on generation time
- Manual intervention interface for content creator oversight
- Comprehensive error handling and fallback mechanisms
- Integration with existing SEO optimization functions
- Real-time quality feedback during generation process

**Dependencies**:
- Existing section-processor.ts service architecture
- Enhanced system prompt with E-E-A-T principles (Story 14-1)
- SEO helper functions (Story 14-4)
- Section templates system (Story 14-3)
- Batch research optimization (Story 20-2)
- Parallel section processing (Story 20-3)
- OpenRouter API integration for content generation
- Next.js 16 and React 19 architecture
- TypeScript strict mode compliance
- Content quality assessment framework

**Priority**: High
**Story Points**: 8
**Target Sprint**: Current sprint

**Implementation Notes**:
- Smart retry system maintains backward compatibility with existing generation workflow
- Quality assessment provides measurable improvements in content generation success rates
- Progressive prompt enhancement ensures each retry attempt addresses specific issues
- Performance optimization ensures retry logic doesn't significantly impact generation speed
- Manual override provides content creators with final control over content acceptance
- Comprehensive analytics enable continuous improvement of retry strategies
- Integration with existing parallel processing maintains performance benefits

## Story Context: 34-1-generate-icp-document-via-perplexity-ai

**Status**: ready-for-dev

**Epic**: Epic 34 - Intent Validation - ICP & Competitive Analysis

**User Story**: As a content manager, I want to generate an ICP document using AI based on my organization's profile, so that I have a clear definition of my target audience before planning content.

**Acceptance Criteria**:
- System calls Perplexity API with organization profile data when ICP generation is triggered
- ICP generation completes within 5 minutes
- Generated ICP includes industries, buyer roles, pain points, and value proposition
- ICP is stored in the workflow's icp_data field
- Workflow status updates to 'step_1_icp' with step_1_icp_completed_at timestamp
- Step is marked as completed with timestamp

**Technical Requirements**:
- OpenRouter Perplexity integration using existing OpenRouter client
- ICP generator service in `lib/services/intent-engine/icp-generator.ts`
- API endpoint: POST `/api/intent/workflows/{workflow_id}/steps/icp-generate`
- Database migration to add icp_data, step_1_icp_completed_at, step_1_icp_error_message fields
- Timeout: 5 minutes maximum with exponential backoff retry (2 attempts)
- ICPData structure with industries, buyerRoles, painPoints, valueProposition fields
- Organization profile data extraction and sanitization before API call
- Audit logging for all ICP generation attempts

**Dependencies**:
- Epic 33 - Workflow Foundation & Organization Setup (COMPLETED ✅)
  - Story 33.1: Create Intent Workflow with Organization Context
  - Story 33.2: Configure Organization ICP Settings
- Existing OpenRouter client from `lib/services/openrouter/openrouter-client.ts`
- Existing authentication patterns (`getCurrentUser()`)
- Supabase database infrastructure

**Priority**: High
**Story Points**: 13
**Target Sprint**: Current sprint

**Implementation Notes**:
- Producer story that generates ICP data for workflow step 1
- Follows established patterns from article generation system
- No UI events, only backend workflow operations
- Terminal state analytics only (workflow_step_completed event)
- Reuses existing OpenRouter client to reduce implementation scope
- Organization data variables populated from intent_workflows table
- Cost tracking integrated with existing OpenRouter system

## Story Context: 34-2-extract-seed-keywords-from-competitor-urls

**Status**: ready-for-dev

**Epic**: Epic 34 - Intent Validation - ICP & Competitive Analysis

**User Story**: As a content manager, I want to analyze competitor websites and extract a small, high-quality set of seed keywords from each competitor domain, so that these seed keywords can be expanded into long-tail keywords and subtopics in later steps of the keyword generation pipeline.

**Acceptance Criteria**:
- System loads active competitor URLs for the organization
- For each competitor URL, the system calls the DataForSEO `keywords_for_site` API endpoint
- System extracts up to 3 seed keywords per competitor, ordered by highest search volume
- For each extracted seed keyword, a record is created in the `keywords` table with seed_keyword, search_volume, competition_level, keyword_difficulty, competitor_url_id, and organization_id
- All created seed keywords are marked with longtail_status, subtopics_status, and article_status as 'not_started'
- Workflow status updates to `step_2_competitors` with step_2_competitor_completed_at timestamp
- Step is marked as completed with timestamp

**Technical Requirements**:
- API endpoint: POST `/api/intent/workflows/{workflow_id}/steps/competitor-analyze`
- DataForSEO endpoint: POST `/v3/dataforseo_labs/google/keywords_for_site/live`
- Service: `lib/services/intent-engine/competitor-seed-extractor.ts`
- One request per competitor URL with limit to top 3 keywords
- Retry: up to 3 attempts (2s, 4s, 8s backoff)
- Timeout: hard stop at 10 minutes total
- Normalized keyword records stored in `keywords` table (no JSON storage)
- Idempotent: re-running overwrites existing seeds, no duplicates
- Non-blocking per competitor: continues with others on failure
- Audit logging for workflow.competitor_seed_keywords.started and .completed actions

**Dependencies**:
- Epic 34.1 - Generate ICP Document via Perplexity AI (COMPLETED ✅)
  - ICP generation is complete
  - Organization context is available
  - Competitor URLs are configured and stored
- Existing DataForSEO API integration
- Existing authentication patterns (`getCurrentUser()`)
- Supabase database infrastructure with `keywords` table

**Priority**: High
**Story Points**: 13
**Target Sprint**: Current sprint

**Implementation Notes**:
- Producer story that creates seed keyword records for workflow step 2
- Follows established patterns from article generation system
- No UI events, only backend workflow operations
- Terminal state analytics only (workflow_step_completed event)
- Establishes foundation for hub-and-spoke SEO model
- Matches Outrank-style keyword engine architecture
- Non-goals: does not generate long-tail keywords, subtopics, or content
- Error handling: if one competitor fails, continue with others; if all fail, fail the step
