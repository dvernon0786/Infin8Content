# Agent Prompts Specification (LOCKED)

## 🎯 Purpose
This document specifies the locked, immutable system prompts and model configurations for the 3-Agent Article Generation Pipeline. Any modification to these prompts or models requires a formal architectural review to prevent "Zero Drift Protocol" violations.

---

## 🤖 Agent 1: Content Planner Agent
**Model:** `z-ai/glm-5`
**Role:** Architecture Authority
**System Prompt:** (LOCKED)
Defined in `content-planner-agent.ts`.

---

## 🤖 Agent 2: Research Agent
**Model:** `z-ai/glm-4.7`
**Fallback:** `openai/gpt-4o-mini`
**Role:** Research Analyst
**System Prompt:** (LOCKED)
Defined in `research-agent.ts`.

---

## 🤖 Agent 3: Content Writing Agent
**Model:** `anthropic/claude-sonnet-4.5`
**Role:** Blog Content Writer
**System Prompt:** (LOCKED)
Defined in `content-writing-agent.ts`.

---

## 📊 OpenRouter Model Reference Table

| Agent | Primary Model | Verified? | Notes |
| :--- | :--- | :--- | :--- |
| **Planner Agent** | `z-ai/glm-5` | ✅ | Latest Z.ai model for architectural planning. |
| **Research Agent** | `z-ai/glm-4.7` | ✅ | Upgrade from Flash for deep synthesis & consolidation. |
| **Writing Agent** | `anthropic/claude-sonnet-4.5` | ✅ | Premium agentic reasoning & prose generation. |

---
**Status:** ✅ PRODUCTION READY - LOCKED
**Last Updated:** 2026-03-02
