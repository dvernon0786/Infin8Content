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
    <principles>- Strict boundaries between story prep and implementation - Stories are single source of truth - Perfect alignment between PRD and dev execution - Enable efficient sprints - Deliver developer-ready specs with precise handoffs</principles>
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
