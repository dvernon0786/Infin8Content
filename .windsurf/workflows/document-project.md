---
description: Document Infin8Content project architecture and implementation
auto_execution_mode: 1
---

# Document Project Workflow - Infin8Content
name: "document-project"
version: "1.0.0"
description: "Analyzes and documents the Infin8Content platform by scanning codebase, architecture, and patterns to create comprehensive reference documentation for AI-assisted development"
author: "Infin8Content System"

# Project configuration
project_root: "{current-directory}"
docs_folder: "{project-root}/docs"
accessible_artifacts: "{project-root}/accessible-artifacts"
planning_artifacts: "{project-root}/planning-artifacts"

# Project metadata
project_name: "Infin8Content"
project_type: "content-generation-platform"
user_skill_level: "intermediate"
date: system-generated

# Documentation structure
output_folder: "{docs_folder}/project-documentation"
architecture_docs: "{output_folder}/architecture"
api_docs: "{output_folder}/api"
workflow_docs: "{output_folder}/workflows"
database_docs: "{output_folder}/database"
deployment_docs: "{output_folder}/deployment"

standalone: true

## Steps

1. **Analyze Project Structure**
   - Scan directory structure and identify key components
   - Map out the intent engine architecture
   - Identify API endpoints and services
   - Document database schema and relationships

2. **Document Core Architecture**
   - Intent Engine workflow system
   - Article generation pipeline
   - Keyword research and expansion
   - Competitor analysis system
   - User authentication and authorization

3. **Document API Contracts**
   - List all API endpoints with methods
   - Document request/response formats
   - Include authentication requirements
   - Map error handling patterns

4. **Document Database Schema**
   - Document all tables and relationships
   - Include migration scripts
   - Document RLS policies
   - Map data flow through the system

5. **Document Workflow System**
   - Epic and story structure
   - Workflow state transitions
   - Acceptance criteria patterns
   - Testing strategies

6. **Document Development Patterns**
   - Code organization principles
   - Testing patterns and coverage
   - Deployment processes
   - Monitoring and observability

// turbo
7. **Generate Comprehensive Documentation**
   - Create architecture overview
   - Generate API reference
   - Document database design
   - Create developer onboarding guide
   - Generate project index

## Documentation Sections

### Architecture Overview
- System components and interactions
- Data flow diagrams
- Service boundaries
- Technology stack

### API Documentation
- Endpoint catalog
- Authentication patterns
- Error handling
- Rate limiting and throttling

### Database Design
- Schema documentation
- Relationship mappings
- Migration history
- Performance considerations

### Workflow Engine
- Intent workflow states
- Epic and story patterns
- Acceptance criteria templates
- Progress tracking

### Development Guide
- Setup instructions
- Code patterns
- Testing strategies
- Deployment processes

## Key Components to Document

### Intent Engine
- Epic 34: ICP & Competitor Analysis
- Epic 35: Keyword Research & Expansion  
- Epic 36: Keyword Refinement & Topic Clustering
- Epic 37: Content Topic Generation & Approval
- Epic 38: Article Generation & Workflow Completion

### Core Services
- Article generation pipeline
- OpenRouter integration
- DataForSEO client
- WordPress publishing
- Real-time updates

### Database Tables
- intent_workflows
- keywords
- articles
- topic_clusters
- audit_logs
- usage_tracking

### API Endpoints
- /api/intent/workflows/*
- /api/keywords/*
- /api/articles/*
- /api/competitor-analysis/*

## Output Files

1. **architecture-overview.md** - System architecture documentation
2. **api-reference.md** - Complete API documentation
3. **database-schema.md** - Database design and relationships
4. **workflow-guide.md** - Intent engine workflow documentation
5. **development-guide.md** - Developer onboarding and patterns
6. **deployment-guide.md** - Deployment and operations documentation
7. **project-index.md** - Master index with links to all documentation

## Quality Gates

- All API endpoints documented
- Database schema fully mapped
- Workflow states and transitions documented
- Code patterns and conventions captured
- Setup and deployment instructions complete
- Architecture diagrams included
