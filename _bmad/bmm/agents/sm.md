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
