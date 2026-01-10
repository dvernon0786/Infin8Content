---
description: workflow-init
auto_execution_mode: 1
---

# Workflow Init - Initial Project Setup
name: workflow-init
description: "Initialize a new BMM project by determining level, type, and creating workflow path"
author: "BMad"

# Critical variables from config
config_source: "{project-root}/_bmad/bmm/config.yaml"
output_folder: "{config_source}:output_folder"
implementation_artifacts: "{config_source}:implementation_artifacts"
planning_artifacts: "{config_source}:planning_artifacts"
user_name: "{config_source}:user_name"
project_name: "{config_source}:project_name"
communication_language: "{config_source}:communication_language"
document_output_language: "{config_source}:document_output_language"
user_skill_level: "{config_source}:user_skill_level"
date: system-generated

# Workflow components
installed_path: "{project-root}/_bmad/bmm/workflows/workflow-status/init"
instructions: "{installed_path}/instructions.md"
template: "{project-root}/_bmad/bmm/workflows/workflow-status/workflow-status-template.yaml"

# Path data files
path_files: "{project-root}/_bmad/bmm/workflows/workflow-status/paths/"

# Output configuration
default_output_file: "{planning_artifacts}/bmm-workflow-status.yaml"

standalone: true

## Steps

1. **Initialize Project Structure**
   - Create necessary directories based on config
   - Set up planning and implementation artifact folders
   - Verify project configuration

2. **Determine Project Level and Type**
   - Analyze project complexity
   - Identify workflow requirements
   - Select appropriate workflow path

3. **Create Workflow Path**
   - Generate workflow status file
   - Set up initial workflow configuration
   - Create tracking documents

4. **Validate Setup**
   - Verify all directories exist
   - Check configuration consistency
   - Confirm workflow initialization complete

// turbo
5. **Output Status**
   - Display initialization summary
   - Show next steps for the user
   - Provide workflow access information
