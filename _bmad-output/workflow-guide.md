# Workflow Guide - Infin8Content

This document explains the dual workflow architectures used in Infin8Content: the **Application Intent Workflow** (end-user content strategy) and the **BMAD Development Workflows** (AI-agent development process).

---

## 🏗️ Part 1: Application Intent Workflow (End-User)
The Intent Engine follows a mathematically closed, 9-step Finite State Machine (FSM) to produce professional content.

### The 9-Step Pipeline
1.  **Generate ICP**: Define the Ideal Customer Profile.
2.  **Analyze Competitors**: Research competitor URLs and content.
3.  **Extract Seeds**: Identify primary seed keywords.
4.  **Expand Longtails**: Use AI to expand seeds into 100+ longtail keywords.
5.  **Filter Keywords**: Human review to select the most relevant targets.
6.  **Cluster Topics**: Hub-and-spoke semantic clustering.
7.  **Validate Clusters**: Verification of cluster relevance and gaps.
8.  **Generate Subtopics**: Break clusters into specific article outlines.
9.  **Queue Articles**: (Human Gate) Final approval to start production.

### Core Principles
- **Linear Progression**: Users must complete steps in order. regressing to incomplete steps is prevented by server-side guards.
- **Backend Authority**: `workflow.current_step` is the single source of truth.
- **Transition Atomicity**: State changes use SQL guards to prevent concurrent execution conflicts.
- **Automation Graph**: Chaining of background jobs handled by Inngest.

### Key Links
- [Workflow Architecture Docs](./docs/workflow-step-pages-architecture.md)
- [FSM Implementation Analysis](./COMPLETE_CODEBASE_ANALYSIS.md#fsm-workflow-engine)

---

## 🛠️ Part 2: BMAD Development Workflows (Agent)
The BMAD framework provides slash-commands to automate the development, planning, and documentation lifecycle.

### Core Commands
| Command | Description |
| :--- | :--- |
| `/workflow-init` | Initialize the project's workflow status and structure. |
| `/document-project`| Perform deep project scans and generate technical docs. |
| `/start-story` | Pick a story from the backlog and initialize task tracking. |
| `/dev` | General-purpose implementation assistance. |
| `/code-review` | Adversarial review of implemented stories. |
| `/test` | Execute the complete test suite across all levels. |
| `/deploy` | Execute production deployment pipelines. |
| `/sprint-status` | Report on current epic and story completion. |

### Operational Modes
- **Initial Scan**: Fresh codebase discovery.
- **Full Rescan**: Updates all documentation with latest changes (current mode).
- **Deep Dive**: Focused documentation on a specific subdirectory.

### Documentation Philosophy (Zero Drift)
- **Living Metadata**: Documentation is updated automatically by deep scans.
- **WORM Compliance**: All critical decisions are recorded in immutable audit logs.
- **Pattern Matching**: Workflows intelligently detect project types using the `documentation-requirements.csv` matrix.

---

## 📈 Monitoring & Execution
- **Real-time Progress**: Viewable in the `GenerationProgress` dashboard component.
- **Audit Logs**: Full history stored in `intent_audit_logs` for compliance.
- **Sprint Status**: Tracked in `_bmad-output/implementation-artifacts/sprint-status.yaml`.

---

**Last Updated**: February 27, 2026
**System Status**: 100% Alignment with Zero-Drift Protocol.
