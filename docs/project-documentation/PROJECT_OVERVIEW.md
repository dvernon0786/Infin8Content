# Project Overview: Infin8Content

**Infin8Content** is an enterprise-grade content generation platform that bridges the gap between AI-generated text and high-authority, grounded content. It automates the entire lifecycle of content discovery, planning, research, and generation, ensuring every article is backed by real-time web sources and adheres to strict SEO standards.

## 🎯 Primary Purpose

The platform enables businesses to:
1.  **Discover**: Identify high-value keywords and competitor gaps.
2.  **Plan**: Architect content structures using intelligent planning agents.
3.  **Research**: Perform real-time web grounding via Tavily to ensure accuracy and freshness.
4.  **Generate**: Produce high-quality, long-form articles in parallel to reduce turnaround time.
5.  **Audit**: Validate content against SEO best practices and E-E-A-T (Experience, Expertise, Authoritativeness, and Trustworthiness) principles.

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | Next.js 16.1.1 (App Router) |
| **UI Library** | React 19.2.3, Radix UI, Tailwind CSS 4 |
| **Language** | TypeScript 5 |
| **Backend & Auth** | Supabase SSR / Edge Functions |
| **Database** | PostgreSQL (Supabase) |
| **Workflow Engine** | Inngest (Serverless Queues & Background Jobs) |
| **AI Orchestration** | Vercel AI SDK, OpenRouter |
| **Real-time Research** | Tavily Search API |
| **Payments** | Stripe |
| **Monitoring** | Sentry, Winston Logging |

## 🏗️ Core Architectural Patterns

-   **Pure Generation Engine**: A "sealed" lifecycle where article status is managed exclusively by the core engine, preventing UI-driven state drift.
-   **Agentic Service Layer**: Modular agents (`Content Writing Agent`, `Research Agent`, `Content Planner`) that handle specific steps of the generation pipeline.
-   **Step-Based Workflows**: A multi-step onboarding and content creation flow that ensures all necessary metadata (brand voice, internal links, competitors) is captured before generation begins.
-   **High-Density Dashboard**: Optimized for operational visibility, featuring GPU-promoted layers, lazy rendering, and real-time status updates.

## 🔐 Security & Compliance

-   **RLS-First Architecture**: Every database query is governed by Supabase Row-Level Security policies.
-   **Audit Logging**: Every critical action (state change, generation trigger) is logged for traceability.
-   **Service Role Hardening**: Strict boundaries between client-side access and server-side privileged operations.

---
_Documentation Part of 2026-03-08 Project Rescan_
