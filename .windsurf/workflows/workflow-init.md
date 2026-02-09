---
description: Initialize a new Infin8Content workflow or project
auto_execution_mode: 1
---

# Workflow Init - Infin8Content Project Setup
name: workflow-init
description: "Initialize a new Infin8Content project by determining project type, scope, and creating workflow configuration"
author: "Infin8Content System"

# Project configuration
project_root: "{current-directory}"
config_file: "{project-root}/infin8-content.config.yaml"
planning_artifacts: "{project-root}/planning-artifacts"
implementation_artifacts: "{project-root}/implementation-artifacts"
docs_folder: "{project-root}/docs"
tests_folder: "{project-root}/tests"

# Project metadata
project_name: "Infin8Content"
project_type: "content-generation-platform"
user_skill_level: "intermediate"
date: system-generated

# Workflow components
workflow_templates: "{project-root}/.windsurf/workflows"
workflow_status_file: "{planning_artifacts}/workflow-status.yaml"

# Output configuration
default_output_file: "{planning_artifacts}/infin8-workflow-init.yaml"

standalone: true

## Steps

1. **Analyze Project Context**
   - Determine if this is a new feature, bug fix, or epic implementation
   - Identify project scope and complexity
   - Assess current system state and dependencies

2. **Determine Workflow Type**
   - **New Feature**: Creates new functionality (articles, keywords, workflows)
   - **Bug Fix**: Resolves issues in existing code
   - **Epic Implementation**: Large multi-story feature implementation
   - **Infrastructure**: DevOps, database, or configuration changes

3. **Create Project Structure**
   - Set up planning artifacts directory
   - Create implementation artifacts directory
   - Initialize documentation structure
   - Set up test directories if needed

4. **Generate Workflow Configuration**
   - Create workflow status file
   - Set up project tracking
   - Configure development environment settings
   - Initialize quality gates and checklists

5. **Validate Dependencies**
   - Check database schema requirements
   - Verify API endpoint availability
   - Confirm service dependencies
   - Validate environment configuration

// turbo
6. **Output Initialization Summary**
   - Display project type and scope
   - Show created directories and files
   - Provide next steps and development guidance
   - List available workflows and commands

## Project Types

### New Feature Workflow
- Creates user-facing functionality
- Requires API endpoints, database changes, tests
- Includes documentation and deployment planning

### Bug Fix Workflow  
- Resolves specific issues
- Minimal code changes
- Regression testing required
- Patch deployment planning

### Epic Implementation Workflow
- Multi-story coordinated implementation
- Cross-team coordination
- Phased rollout planning
- Comprehensive testing strategy

### Infrastructure Workflow
- Database migrations
- Service configuration
- Deployment pipeline changes
- Monitoring and observability

## Quality Gates

- All new features require test coverage
- Database changes need migration scripts
- API changes require contract updates
- Documentation must be updated
- Security review for sensitive changes

## Next Steps After Init

1. Choose specific workflow based on project type
2. Follow workflow-specific steps
3. Use appropriate agent for specialized tasks
4. Track progress in workflow status file
5. Validate completion against acceptance criteria
